/**
 * Architectural Validation Report for Haruspex Cleanup System
 * 
 * This script analyzes the compiled cleanup components for:
 * - Implementation quality and patterns
 * - Safety mechanism validation
 * - Architecture compliance with documented requirements
 * - Integration patterns and coordination
 * - Error handling and recovery capabilities
 */

const fs = require('fs');
const path = require('path');

class ArchitecturalValidator {
  constructor() {
    this.findings = [];
    this.components = [
      'haruspex-process-manager.js',
      'haruspex-file-cleanup.js', 
      'haruspex-command-manager.js',
      'haruspex-cleanup-orchestrator.js'
    ];
    this.distPath = path.join(__dirname, 'dist', 'src', 'core');
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : 
                  level === 'warning' ? '⚠️' : 
                  level === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addFinding(component, category, finding, status = 'pass') {
    this.findings.push({
      component,
      category,
      finding,
      status,
      timestamp: new Date().toISOString()
    });
  }

  async validateComponentExists(component) {
    const componentPath = path.join(this.distPath, component);
    if (!fs.existsSync(componentPath)) {
      this.addFinding(component, 'Compilation', 'Component not found in dist', 'fail');
      return false;
    }
    this.addFinding(component, 'Compilation', 'Component compiled successfully', 'pass');
    return true;
  }

  async analyzeProcessManager() {
    this.log('🔍 Analyzing Process Manager Implementation...');
    const component = 'haruspex-process-manager.js';
    
    if (!await this.validateComponentExists(component)) return;

    const content = fs.readFileSync(path.join(this.distPath, component), 'utf8');

    // Check for safety mechanisms
    const safetyChecks = [
      { pattern: /verifyProcessOwnership/, requirement: 'Process ownership verification' },
      { pattern: /gracefulShutdownTimeout/, requirement: 'Graceful shutdown timeout' },
      { pattern: /orphanDetectionThreshold/, requirement: 'Orphan detection configuration' },
      { pattern: /enableSafetyChecks/, requirement: 'Safety checks configuration' },
      { pattern: /sessionId.*haruspex/, requirement: 'Session ID generation' },
      { pattern: /EventEmitter/, requirement: 'Event-driven architecture' }
    ];

    safetyChecks.forEach(check => {
      if (content.includes(check.pattern.source || check.pattern)) {
        this.addFinding(component, 'Safety', `✅ ${check.requirement}`, 'pass');
      } else {
        this.addFinding(component, 'Safety', `❌ Missing: ${check.requirement}`, 'fail');
      }
    });

    // Check for process tracking methods
    const trackingMethods = [
      'trackProcess', 'trackTimer', 'trackServer', 'terminateProcess', 
      'detectOrphanedProcesses', 'cleanupAllProcesses'
    ];

    trackingMethods.forEach(method => {
      if (content.includes(method)) {
        this.addFinding(component, 'API', `✅ Method: ${method}`, 'pass');
      } else {
        this.addFinding(component, 'API', `❌ Missing method: ${method}`, 'fail');
      }
    });

    // Check error handling
    const errorHandlingPatterns = [
      /try\s*{[\s\S]*?catch\s*\(/g,
      /Promise\.catch/g,
      /\.catch\(/g,
      /Error.*message/g
    ];

    let errorHandlingCount = 0;
    errorHandlingPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) errorHandlingCount += matches.length;
    });

    if (errorHandlingCount >= 5) {
      this.addFinding(component, 'Error Handling', `✅ Comprehensive error handling (${errorHandlingCount} patterns)`, 'pass');
    } else {
      this.addFinding(component, 'Error Handling', `⚠️ Limited error handling (${errorHandlingCount} patterns)`, 'warning');
    }
  }

  async analyzeFileCleanup() {
    this.log('🔍 Analyzing File Cleanup Implementation...');
    const component = 'haruspex-file-cleanup.js';
    
    if (!await this.validateComponentExists(component)) return;

    const content = fs.readFileSync(path.join(this.distPath, component), 'utf8');

    // Check for user work protection
    const protectionChecks = [
      { pattern: /protectedPatterns/, requirement: 'Protected pattern configuration' },
      { pattern: /matchesPattern/, requirement: 'Pattern matching logic' },
      { pattern: /classifyProtectedFile/, requirement: 'File classification system' },
      { pattern: /enableSafetyChecks/, requirement: 'Safety checks toggle' },
      { pattern: /tempFilePatterns/, requirement: 'Temporary file pattern matching' },
      { pattern: /maxFileAge/, requirement: 'File age validation' }
    ];

    protectionChecks.forEach(check => {
      if (content.includes(check.pattern.source || check.pattern)) {
        this.addFinding(component, 'User Protection', `✅ ${check.requirement}`, 'pass');
      } else {
        this.addFinding(component, 'User Protection', `❌ Missing: ${check.requirement}`, 'fail');
      }
    });

    // Check for cleanup methods
    const cleanupMethods = [
      'scanTempFiles', 'cleanupTempFiles', 'isFileProtected', 
      'validateFileSafety', 'generateCleanupReport'
    ];

    cleanupMethods.forEach(method => {
      if (content.includes(method)) {
        this.addFinding(component, 'API', `✅ Method: ${method}`, 'pass');
      } else {
        this.addFinding(component, 'API', `❌ Missing method: ${method}`, 'fail');
      }
    });

    // Check for dry run support
    if (content.includes('dryRun') || content.includes('dry-run')) {
      this.addFinding(component, 'Safety', '✅ Dry run support', 'pass');
    } else {
      this.addFinding(component, 'Safety', '❌ Missing dry run support', 'fail');
    }
  }

  async analyzeCommandManager() {
    this.log('🔍 Analyzing Command Manager Implementation...');
    const component = 'haruspex-command-manager.js';
    
    if (!await this.validateComponentExists(component)) return;

    const content = fs.readFileSync(path.join(this.distPath, component), 'utf8');

    // Check for conflict resolution
    const conflictChecks = [
      { pattern: /enableConflictResolution/, requirement: 'Conflict resolution configuration' },
      { pattern: /enableHotReloadSupport/, requirement: 'Hot reload support' },
      { pattern: /registrationTimeout/, requirement: 'Registration timeout handling' },
      { pattern: /disposable/i, requirement: 'Disposable resource management' },
      { pattern: /vscode.*commands/, requirement: 'VS Code command integration' }
    ];

    conflictChecks.forEach(check => {
      if (content.match(check.pattern)) {
        this.addFinding(component, 'Conflict Resolution', `✅ ${check.requirement}`, 'pass');
      } else {
        this.addFinding(component, 'Conflict Resolution', `❌ Missing: ${check.requirement}`, 'fail');
      }
    });

    // Check for command management methods
    const commandMethods = [
      'registerCommand', 'unregisterCommand', 'getRegisteredCommands',
      'getRegistrationStats', 'generateReport', 'cleanupCommands'
    ];

    commandMethods.forEach(method => {
      if (content.includes(method)) {
        this.addFinding(component, 'API', `✅ Method: ${method}`, 'pass');
      } else {
        this.addFinding(component, 'API', `❌ Missing method: ${method}`, 'fail');
      }
    });
  }

  async analyzeCleanupOrchestrator() {
    this.log('🔍 Analyzing Cleanup Orchestrator Implementation...');
    const component = 'haruspex-cleanup-orchestrator.js';
    
    if (!await this.validateComponentExists(component)) return;

    const content = fs.readFileSync(path.join(this.distPath, component), 'utf8');

    // Check for orchestration capabilities
    const orchestrationChecks = [
      { pattern: /enableProcessManagement/, requirement: 'Process management toggle' },
      { pattern: /enableFileCleanup/, requirement: 'File cleanup toggle' },
      { pattern: /enableCommandManagement/, requirement: 'Command management toggle' },
      { pattern: /enableCrashRecovery/, requirement: 'Crash recovery toggle' },
      { pattern: /gracefulShutdownTimeout/, requirement: 'Graceful shutdown configuration' },
      { pattern: /HaruspexProcessManager/, requirement: 'Process manager integration' },
      { pattern: /HaruspexFileCleanup/, requirement: 'File cleanup integration' },
      { pattern: /HaruspexCommandManager/, requirement: 'Command manager integration' }
    ];

    orchestrationChecks.forEach(check => {
      if (content.match(check.pattern)) {
        this.addFinding(component, 'Orchestration', `✅ ${check.requirement}`, 'pass');
      } else {
        this.addFinding(component, 'Orchestration', `❌ Missing: ${check.requirement}`, 'fail');
      }
    });

    // Check for lifecycle management
    const lifecycleMethods = [
      'initialize', 'performStartupRecovery', 'trackProcess', 'trackTimer',
      'performGracefulShutdown', 'performEmergencyShutdown', 'getStatus',
      'generateStatusReport'
    ];

    lifecycleMethods.forEach(method => {
      if (content.includes(method)) {
        this.addFinding(component, 'Lifecycle', `✅ Method: ${method}`, 'pass');
      } else {
        this.addFinding(component, 'Lifecycle', `❌ Missing method: ${method}`, 'fail');
      }
    });

    // Check for comprehensive result structure
    const resultStructures = [
      'orphanProcesses', 'fileCleanup', 'commandConflicts', 'summary'
    ];

    resultStructures.forEach(structure => {
      if (content.includes(structure)) {
        this.addFinding(component, 'Reporting', `✅ Result structure: ${structure}`, 'pass');
      } else {
        this.addFinding(component, 'Reporting', `❌ Missing structure: ${structure}`, 'fail');
      }
    });
  }

  async validateArchitecturalPatterns() {
    this.log('🔍 Validating Architectural Patterns...');

    // Check if all components are compiled
    const allExist = this.components.every(comp => 
      fs.existsSync(path.join(this.distPath, comp))
    );

    if (allExist) {
      this.addFinding('Architecture', 'Compilation', '✅ All components compiled successfully', 'pass');
    } else {
      this.addFinding('Architecture', 'Compilation', '❌ Missing compiled components', 'fail');
    }

    // Check for consistent patterns across components
    const consistencyChecks = [
      { pattern: 'EventEmitter', requirement: 'Event-driven architecture' },
      { pattern: 'config.*=.*{', requirement: 'Configuration pattern' },
      { pattern: 'debugLog', requirement: 'Consistent logging' },
      { pattern: 'async.*{', requirement: 'Async/await pattern' },
      { pattern: 'try.*{', requirement: 'Error handling pattern' }
    ];

    consistencyChecks.forEach(check => {
      let componentCount = 0;
      this.components.forEach(comp => {
        const componentPath = path.join(this.distPath, comp);
        if (fs.existsSync(componentPath)) {
          const content = fs.readFileSync(componentPath, 'utf8');
          if (content.includes(check.pattern)) {
            componentCount++;
          }
        }
      });

      if (componentCount >= 3) {
        this.addFinding('Architecture', 'Consistency', `✅ ${check.requirement} used consistently (${componentCount}/4 components)`, 'pass');
      } else {
        this.addFinding('Architecture', 'Consistency', `⚠️ ${check.requirement} inconsistent usage (${componentCount}/4 components)`, 'warning');
      }
    });
  }

  async validateDocumentedRequirements() {
    this.log('🔍 Validating Against Documented Requirements...');

    // Requirements from the implementation document
    const requirements = [
      {
        requirement: 'Process tracking with PID management',
        validate: () => {
          const processManager = path.join(this.distPath, 'haruspex-process-manager.js');
          if (fs.existsSync(processManager)) {
            const content = fs.readFileSync(processManager, 'utf8');
            return content.includes('trackProcess') && content.includes('pid');
          }
          return false;
        }
      },
      {
        requirement: 'Safe temporary file cleanup with user work protection',
        validate: () => {
          const fileCleanup = path.join(this.distPath, 'haruspex-file-cleanup.js');
          if (fs.existsSync(fileCleanup)) {
            const content = fs.readFileSync(fileCleanup, 'utf8');
            return content.includes('protectedPatterns') && content.includes('tempFilePatterns');
          }
          return false;
        }
      },
      {
        requirement: 'Command registration conflict resolution',
        validate: () => {
          const commandManager = path.join(this.distPath, 'haruspex-command-manager.js');
          if (fs.existsSync(commandManager)) {
            const content = fs.readFileSync(commandManager, 'utf8');
            return content.includes('ConflictResolution') && content.includes('HotReload');
          }
          return false;
        }
      },
      {
        requirement: 'Central cleanup orchestration with crash recovery',
        validate: () => {
          const orchestrator = path.join(this.distPath, 'haruspex-cleanup-orchestrator.js');
          if (fs.existsSync(orchestrator)) {
            const content = fs.readFileSync(orchestrator, 'utf8');
            return content.includes('initialize') && content.includes('CrashRecovery');
          }
          return false;
        }
      },
      {
        requirement: 'Graceful and emergency shutdown capabilities',
        validate: () => {
          const orchestrator = path.join(this.distPath, 'haruspex-cleanup-orchestrator.js');
          if (fs.existsSync(orchestrator)) {
            const content = fs.readFileSync(orchestrator, 'utf8');
            return content.includes('gracefulShutdown') && content.includes('emergencyShutdown');
          }
          return false;
        }
      }
    ];

    requirements.forEach(req => {
      if (req.validate()) {
        this.addFinding('Requirements', 'Compliance', `✅ ${req.requirement}`, 'pass');
      } else {
        this.addFinding('Requirements', 'Compliance', `❌ Missing: ${req.requirement}`, 'fail');
      }
    });
  }

  generateReport() {
    this.log('\n' + '='.repeat(80));
    this.log('🏗️ HARUSPEX CLEANUP SYSTEM - ARCHITECTURAL VALIDATION REPORT');
    this.log('='.repeat(80));

    // Group findings by component and category
    const groupedFindings = {};
    this.findings.forEach(finding => {
      const key = `${finding.component} - ${finding.category}`;
      if (!groupedFindings[key]) {
        groupedFindings[key] = [];
      }
      groupedFindings[key].push(finding);
    });

    // Print detailed findings
    Object.keys(groupedFindings).sort().forEach(key => {
      this.log(`\n📋 ${key}`);
      this.log('-'.repeat(40));
      
      groupedFindings[key].forEach(finding => {
        const status = finding.status === 'pass' ? '✅' : 
                     finding.status === 'fail' ? '❌' : '⚠️';
        this.log(`  ${status} ${finding.finding}`);
      });
    });

    // Generate summary statistics
    const stats = {
      total: this.findings.length,
      pass: this.findings.filter(f => f.status === 'pass').length,
      fail: this.findings.filter(f => f.status === 'fail').length,
      warning: this.findings.filter(f => f.status === 'warning').length
    };

    this.log('\n' + '='.repeat(80));
    this.log('📊 VALIDATION SUMMARY');
    this.log('='.repeat(80));
    this.log(`Total Checks: ${stats.total}`);
    this.log(`✅ Passed: ${stats.pass}`);
    this.log(`❌ Failed: ${stats.fail}`);
    this.log(`⚠️ Warnings: ${stats.warning}`);
    this.log(`Success Rate: ${Math.round((stats.pass / stats.total) * 100)}%`);

    // Overall assessment
    const successRate = (stats.pass / stats.total) * 100;
    if (successRate >= 90 && stats.fail === 0) {
      this.log('\n🎉 EXCELLENT: Cleanup system implementation is architecturally sound!', 'success');
    } else if (successRate >= 80 && stats.fail <= 2) {
      this.log('\n✅ GOOD: Cleanup system implementation is solid with minor issues.', 'success');
    } else if (successRate >= 70) {
      this.log('\n⚠️ ACCEPTABLE: Cleanup system has some architectural concerns to address.');
    } else {
      this.log('\n❌ NEEDS WORK: Cleanup system has significant architectural issues.', 'error');
    }

    // Key findings summary
    this.log('\n🔍 KEY ARCHITECTURAL FINDINGS:');
    this.log('-'.repeat(40));
    
    if (stats.pass > 0) {
      this.log('✅ STRENGTHS:');
      this.findings
        .filter(f => f.status === 'pass' && f.category === 'Safety')
        .slice(0, 3)
        .forEach(f => this.log(`   • ${f.finding}`));
    }

    if (stats.fail > 0) {
      this.log('❌ CRITICAL ISSUES:');
      this.findings
        .filter(f => f.status === 'fail')
        .slice(0, 3)
        .forEach(f => this.log(`   • ${f.finding}`));
    }

    if (stats.warning > 0) {
      this.log('⚠️ IMPROVEMENT OPPORTUNITIES:');
      this.findings
        .filter(f => f.status === 'warning')
        .slice(0, 3)
        .forEach(f => this.log(`   • ${f.finding}`));
    }

    return stats;
  }

  async runCompleteValidation() {
    this.log('🚀 Starting Comprehensive Architectural Validation...\n');
    
    try {
      // Check basic file existence and compilation
      this.log('📦 Phase 1: Component Compilation Validation');
      await this.validateArchitecturalPatterns();
      
      // Analyze each component in detail
      this.log('\n🔍 Phase 2: Individual Component Analysis');
      await this.analyzeProcessManager();
      await this.analyzeFileCleanup();
      await this.analyzeCommandManager();
      await this.analyzeCleanupOrchestrator();
      
      // Validate against documented requirements
      this.log('\n📋 Phase 3: Requirements Compliance Validation');
      await this.validateDocumentedRequirements();
      
    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`, 'error');
      this.addFinding('Validation', 'Error', `Validation process failed: ${error.message}`, 'fail');
    }
    
    return this.generateReport();
  }
}

// Run the validation
if (require.main === module) {
  const validator = new ArchitecturalValidator();
  validator.runCompleteValidation().catch(error => {
    console.error('❌ Architectural validation failed:', error);
    process.exit(1);
  });
}

module.exports = { ArchitecturalValidator };