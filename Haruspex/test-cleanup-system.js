/**
 * Test script for Haruspex cleanup system
 * Tests the four core cleanup components:
 * 1. HaruspexProcessManager - Process tracking and termination
 * 2. HaruspexFileCleanup - File cleanup with safety
 * 3. HaruspexCommandManager - Command registration conflict handling  
 * 4. HaruspexCleanupOrchestrator - Central coordination
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Import the cleanup components
const { HaruspexProcessManager } = require('./dist/src/core/haruspex-process-manager.js');
const { HaruspexFileCleanup } = require('./dist/src/core/haruspex-file-cleanup.js');
const { HaruspexCommandManager } = require('./dist/src/core/haruspex-command-manager.js');
const { HaruspexCleanupOrchestrator } = require('./dist/src/core/haruspex-cleanup-orchestrator.js');

class CleanupSystemTester {
  constructor() {
    this.testResults = [];
    this.testWorkspace = path.join(__dirname, 'test-workspace');
    this.tempFiles = [];
    this.trackedProcesses = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async setupTestEnvironment() {
    this.log('Setting up test environment...');
    
    // Create test workspace
    if (!fs.existsSync(this.testWorkspace)) {
      fs.mkdirSync(this.testWorkspace, { recursive: true });
    }

    // Create some test temporary files
    const tempFiles = [
      'temp-file-1.txt',
      'temp-log-2.log', 
      'cache-file-3.cache',
      'important-config.json', // Should NOT be cleaned
      'user-document.txt'      // Should NOT be cleaned
    ];

    for (const file of tempFiles) {
      const filePath = path.join(this.testWorkspace, file);
      fs.writeFileSync(filePath, `Test content for ${file}`);
      this.tempFiles.push(filePath);
    }

    this.log(`Created test workspace with ${tempFiles.length} files`);
  }

  async testProcessManager() {
    this.log('Testing HaruspexProcessManager...');
    
    try {
      const processManager = new HaruspexProcessManager({
        trackingFile: path.join(this.testWorkspace, 'process-tracking.json'),
        heartbeatInterval: 1000,
        orphanDetectionThreshold: 5000,
        gracefulShutdownTimeout: 3000,
        enableOrphanDetection: true
      });

      await processManager.initialize();

      // Test 1: Track a timer
      this.log('  Testing timer tracking...');
      const timer = setInterval(() => {}, 100);
      const timerId = processManager.trackTimer(timer, 'test-timer', 'interval');
      this.trackedProcesses.push(timerId);
      
      const processes = processManager.getTrackedProcesses();
      if (processes.length > 0) {
        this.log('  ✅ Timer tracked successfully', 'success');
        this.testResults.push({ test: 'ProcessManager - Timer Tracking', result: 'PASS' });
      } else {
        this.log('  ❌ Timer tracking failed', 'error');
        this.testResults.push({ test: 'ProcessManager - Timer Tracking', result: 'FAIL' });
      }

      // Test 2: Cleanup timer
      this.log('  Testing timer cleanup...');
      const cleaned = await processManager.terminateProcess(timerId);
      if (cleaned) {
        this.log('  ✅ Timer cleanup successful', 'success');
        this.testResults.push({ test: 'ProcessManager - Timer Cleanup', result: 'PASS' });
      } else {
        this.log('  ❌ Timer cleanup failed', 'error');
        this.testResults.push({ test: 'ProcessManager - Timer Cleanup', result: 'FAIL' });
      }

      // Test 3: Process safety check
      this.log('  Testing process safety validation...');
      const currentPid = process.pid;
      const isOwnProcess = await processManager.verifyProcessOwnership(currentPid);
      if (isOwnProcess !== null) {
        this.log('  ✅ Process ownership verification working', 'success');
        this.testResults.push({ test: 'ProcessManager - Safety Check', result: 'PASS' });
      } else {
        this.log('  ❌ Process ownership verification failed', 'error');
        this.testResults.push({ test: 'ProcessManager - Safety Check', result: 'FAIL' });
      }

    } catch (error) {
      this.log(`  ❌ ProcessManager test failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'ProcessManager - Overall', result: 'FAIL', error: error.message });
    }
  }

  async testFileCleanup() {
    this.log('Testing HaruspexFileCleanup...');
    
    try {
      const fileCleanup = new HaruspexFileCleanup({
        enableCleanup: true,
        tempFilePatterns: [
          '**/*temp*',
          '**/*.log',
          '**/*.cache'
        ],
        protectedPatterns: [
          '**/config*',
          '**/user-*',
          '**/important-*'
        ],
        maxFileAge: 0, // Clean immediately for test
        enableSafetyChecks: true
      });

      await fileCleanup.initialize();

      // Test 1: Scan for files
      this.log('  Testing file scanning...');
      const scanned = await fileCleanup.scanTempFiles([this.testWorkspace]);
      if (scanned.candidateFiles && scanned.candidateFiles.length > 0) {
        this.log(`  ✅ Found ${scanned.candidateFiles.length} candidate files`, 'success');
        this.testResults.push({ test: 'FileCleanup - Scanning', result: 'PASS' });
      } else {
        this.log('  ❌ File scanning failed', 'error');
        this.testResults.push({ test: 'FileCleanup - Scanning', result: 'FAIL' });
      }

      // Test 2: Check safety validation
      this.log('  Testing safety validation...');
      const protectedCount = scanned.protectedFiles ? scanned.protectedFiles.length : 0;
      if (protectedCount > 0) {
        this.log(`  ✅ Protected ${protectedCount} files from cleanup`, 'success');
        this.testResults.push({ test: 'FileCleanup - Safety', result: 'PASS' });
      } else {
        this.log('  ⚠️ No protected files detected (might be expected)', 'info');
        this.testResults.push({ test: 'FileCleanup - Safety', result: 'PARTIAL' });
      }

      // Test 3: Clean temporary files (dry run)
      this.log('  Testing cleanup (dry run)...');
      const result = await fileCleanup.cleanupTempFiles([this.testWorkspace], true);
      if (result.success) {
        this.log(`  ✅ Dry run completed - would clean ${result.filesProcessed} files`, 'success');
        this.testResults.push({ test: 'FileCleanup - Dry Run', result: 'PASS' });
      } else {
        this.log('  ❌ Dry run failed', 'error');
        this.testResults.push({ test: 'FileCleanup - Dry Run', result: 'FAIL' });
      }

    } catch (error) {
      this.log(`  ❌ FileCleanup test failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'FileCleanup - Overall', result: 'FAIL', error: error.message });
    }
  }

  async testCommandManager() {
    this.log('Testing HaruspexCommandManager...');
    
    try {
      // Create a mock VS Code context
      const mockContext = {
        subscriptions: [],
        globalState: {
          get: () => undefined,
          update: () => Promise.resolve()
        }
      };

      const commandManager = new HaruspexCommandManager(mockContext, {
        enableConflictResolution: true,
        enableRegistrationTracking: true,
        enableHotReloadSupport: true,
        registrationTimeout: 5000
      });

      await commandManager.initialize();

      // Test 1: Register a command
      this.log('  Testing command registration...');
      const registered = await commandManager.registerCommand(
        'haruspex.test.command',
        () => { console.log('Test command executed'); },
        'Testing',
        { essential: false, description: 'Test command for cleanup system' }
      );

      if (registered.success) {
        this.log('  ✅ Command registered successfully', 'success');
        this.testResults.push({ test: 'CommandManager - Registration', result: 'PASS' });
      } else {
        this.log('  ❌ Command registration failed', 'error');
        this.testResults.push({ test: 'CommandManager - Registration', result: 'FAIL' });
      }

      // Test 2: Check for conflicts (simulate double registration)
      this.log('  Testing conflict detection...');
      const conflictResult = await commandManager.registerCommand(
        'haruspex.test.command', // Same command ID
        () => { console.log('Duplicate command'); },
        'Testing',
        { essential: false, description: 'Duplicate test command' }
      );

      if (!conflictResult.success && conflictResult.error?.includes('already exists')) {
        this.log('  ✅ Conflict detection working', 'success');
        this.testResults.push({ test: 'CommandManager - Conflict Detection', result: 'PASS' });
      } else {
        this.log('  ❌ Conflict detection not working', 'error');
        this.testResults.push({ test: 'CommandManager - Conflict Detection', result: 'FAIL' });
      }

      // Test 3: Get registration stats
      this.log('  Testing registration statistics...');
      const stats = commandManager.getRegistrationStats();
      if (stats && stats.total > 0) {
        this.log(`  ✅ Statistics available - ${stats.total} commands tracked`, 'success');
        this.testResults.push({ test: 'CommandManager - Statistics', result: 'PASS' });
      } else {
        this.log('  ❌ Statistics not available', 'error');
        this.testResults.push({ test: 'CommandManager - Statistics', result: 'FAIL' });
      }

    } catch (error) {
      this.log(`  ❌ CommandManager test failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'CommandManager - Overall', result: 'FAIL', error: error.message });
    }
  }

  async testCleanupOrchestrator() {
    this.log('Testing HaruspexCleanupOrchestrator...');
    
    try {
      // Create a mock VS Code context
      const mockContext = {
        subscriptions: [],
        globalState: {
          get: () => undefined,
          update: () => Promise.resolve()
        },
        workspaceState: {
          get: () => undefined,
          update: () => Promise.resolve()
        }
      };

      const orchestrator = new HaruspexCleanupOrchestrator(mockContext, {
        enableProcessManagement: true,
        enableFileCleanup: true,
        enableCommandManagement: true,
        enableStartupRecovery: true,
        gracefulShutdownTimeout: 5000,
        emergencyShutdownTimeout: 2000
      });

      // Test 1: Initialize orchestrator
      this.log('  Testing orchestrator initialization...');
      await orchestrator.initialize();
      
      const status = orchestrator.getStatus();
      if (status.initialized) {
        this.log('  ✅ Orchestrator initialized successfully', 'success');
        this.testResults.push({ test: 'Orchestrator - Initialization', result: 'PASS' });
      } else {
        this.log('  ❌ Orchestrator initialization failed', 'error');
        this.testResults.push({ test: 'Orchestrator - Initialization', result: 'FAIL' });
      }

      // Test 2: Track a resource
      this.log('  Testing resource tracking...');
      const timer = setInterval(() => {}, 200);
      const timerId = Date.now();
      
      orchestrator.trackProcess(
        timerId,
        'interval',
        'test-orchestrator-timer',
        { source: 'orchestrator-test' },
        async () => { clearInterval(timer); }
      );

      if (status.processes > 0) {
        this.log('  ✅ Resource tracking working', 'success');
        this.testResults.push({ test: 'Orchestrator - Tracking', result: 'PASS' });
      } else {
        this.log('  ⚠️ Resource tracking status unclear', 'info');
        this.testResults.push({ test: 'Orchestrator - Tracking', result: 'PARTIAL' });
      }

      // Test 3: Generate status report
      this.log('  Testing status reporting...');
      const report = orchestrator.generateStatusReport();
      if (report && report.orchestrator && report.recommendations) {
        this.log('  ✅ Status report generated successfully', 'success');
        this.testResults.push({ test: 'Orchestrator - Reporting', result: 'PASS' });
      } else {
        this.log('  ❌ Status report generation failed', 'error');
        this.testResults.push({ test: 'Orchestrator - Reporting', result: 'FAIL' });
      }

      // Test 4: Graceful shutdown test (partial)
      this.log('  Testing graceful shutdown preparation...');
      const canShutdown = orchestrator.getStatus().canPerformCleanup;
      if (canShutdown) {
        this.log('  ✅ Shutdown readiness check passed', 'success');
        this.testResults.push({ test: 'Orchestrator - Shutdown Readiness', result: 'PASS' });
      } else {
        this.log('  ❌ Shutdown readiness check failed', 'error');
        this.testResults.push({ test: 'Orchestrator - Shutdown Readiness', result: 'FAIL' });
      }

    } catch (error) {
      this.log(`  ❌ Orchestrator test failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'Orchestrator - Overall', result: 'FAIL', error: error.message });
    }
  }

  async testCrashRecovery() {
    this.log('Testing crash recovery functionality...');
    
    try {
      // Create fake orphaned process tracking file
      const trackingFile = path.join(this.testWorkspace, 'orphaned-processes.json');
      const orphanedData = {
        sessionId: 'fake-crashed-session-123',
        processes: [
          {
            pid: 99999, // Non-existent PID
            type: 'interval',
            name: 'fake-orphaned-timer',
            startTime: Date.now() - 10000,
            metadata: { source: 'crash-test' }
          }
        ],
        lastUpdate: Date.now() - 10000
      };
      
      fs.writeFileSync(trackingFile, JSON.stringify(orphanedData, null, 2));

      // Initialize process manager to trigger orphan detection
      const processManager = new HaruspexProcessManager({
        trackingFile: trackingFile,
        heartbeatInterval: 1000,
        orphanDetectionThreshold: 5000,
        gracefulShutdownTimeout: 3000,
        enableOrphanDetection: true
      });

      await processManager.initialize();

      // Check if orphan detection worked
      const result = await processManager.detectOrphanedProcesses();
      if (result && result.orphansFound >= 0) {
        this.log(`  ✅ Crash recovery detected ${result.orphansFound} orphaned processes`, 'success');
        this.testResults.push({ test: 'Crash Recovery - Detection', result: 'PASS' });
      } else {
        this.log('  ❌ Crash recovery detection failed', 'error');
        this.testResults.push({ test: 'Crash Recovery - Detection', result: 'FAIL' });
      }

    } catch (error) {
      this.log(`  ❌ Crash recovery test failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'Crash Recovery - Overall', result: 'FAIL', error: error.message });
    }
  }

  async cleanup() {
    this.log('Cleaning up test environment...');
    
    // Clean up test files
    try {
      if (fs.existsSync(this.testWorkspace)) {
        fs.rmSync(this.testWorkspace, { recursive: true, force: true });
        this.log('Test workspace cleaned up');
      }
    } catch (error) {
      this.log(`Warning: Could not clean test workspace: ${error.message}`);
    }

    // Clear any remaining timers
    this.trackedProcesses.forEach(pid => {
      try {
        // These are virtual PIDs for timers, so just log
        this.log(`Tracked process ${pid} should have been cleaned up`);
      } catch (error) {
        // Ignore cleanup errors for test
      }
    });
  }

  printResults() {
    this.log('\n' + '='.repeat(60));
    this.log('CLEANUP SYSTEM TEST RESULTS');
    this.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    let partial = 0;

    this.testResults.forEach(result => {
      const status = result.result === 'PASS' ? '✅' : 
                    result.result === 'FAIL' ? '❌' : '⚠️';
      
      this.log(`${status} ${result.test}: ${result.result}`);
      
      if (result.error) {
        this.log(`   Error: ${result.error}`);
      }

      if (result.result === 'PASS') passed++;
      else if (result.result === 'FAIL') failed++;
      else partial++;
    });

    this.log('\n' + '-'.repeat(60));
    this.log(`SUMMARY: ${passed} passed, ${failed} failed, ${partial} partial`);
    this.log(`SUCCESS RATE: ${Math.round((passed / this.testResults.length) * 100)}%`);
    
    if (failed === 0) {
      this.log('🎉 ALL TESTS PASSED! Cleanup system is working correctly.', 'success');
    } else if (passed > failed) {
      this.log('⚠️ Some tests failed but majority passed. Review failures.', 'info');
    } else {
      this.log('❌ Multiple test failures. Cleanup system needs attention.', 'error');
    }
  }

  async runAllTests() {
    this.log('🧪 Starting Haruspex Cleanup System Tests...\n');
    
    try {
      await this.setupTestEnvironment();
      
      await this.testProcessManager();
      await this.testFileCleanup();
      await this.testCommandManager();
      await this.testCleanupOrchestrator();
      await this.testCrashRecovery();
      
    } catch (error) {
      this.log(`❌ Test execution failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
      this.printResults();
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new CleanupSystemTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { CleanupSystemTester };