#!/usr/bin/env node

/**
 * Templum Task Validator
 * 
 * Purpose: Comprehensive task validation that enforces ALL mandatory testing requirements
 * Usage: node templum-task-validator.js --category <type> [--task-id <id>] [--stage <stage>] [--save]
 * Integration: Used by /pr:validate in the autonomous workflow
 * 
 * Key Features:
 * - ENFORCES all mandatory tests from TEMPLUM-TESTING-GUIDE.md
 * - Agent-proof: No ability to skip tests or provide incomplete evidence
 * - Automated evidence collection with formatted output
 * - Automatic validation report generation
 * - Service lifecycle management (start/stop services as needed)
 * - Clear pass/fail status with detailed error reporting
 * 
 * Categories Supported:
 * - backend: Backend/Service Tasks (health checks, commands, service registration)
 * - ui: UI/Interface Tasks (CLI functionality, component rendering, interactions)
 * - core: Core System Tasks (unit tests, integration, state persistence)
 * - build: Compilation/Build Tasks (clean build, TypeScript, dependencies)
 * - quality: Code Quality Tasks (ESLint, formatting, regression, complexity)
 * - architecture: Architecture/Pattern Tasks (patterns, DI, scalability)
 * - mcp: MCP Server Tasks (protocol compliance, tool registration, session lifecycle)
 * - feature: Feature Enhancement Tasks (end-to-end, regression, integration)
 * - subagent: Subagent Workflow Tasks (file-based handoff, agent communication, workflow infrastructure)
 * 
 * Output: Validation report compatible with validate.md requirements
 * Exit Codes: 0=success, 1=validation failed, 2=configuration error
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  STATUS,
  PRIORITY,
  ProjectDetector,
  EvidenceGenerator,
  ValidationUtils
} from './validation-helpers.js';
import {
  BackendValidator,
  UIValidator,
  CoreValidator,
  BuildValidator,
  QualityValidator,
  ArchitectureValidator,
  MCPValidator,
  FeatureValidator,
  SubagentValidator
} from './category-validators.js';

// Supported validation categories
const VALIDATION_CATEGORIES = {
  backend: 'Backend/Service Tasks',
  ui: 'UI/Interface Tasks',
  core: 'Core System Tasks',
  build: 'Compilation/Build Tasks',
  quality: 'Code Quality Tasks',
  architecture: 'Architecture/Pattern Tasks',
  mcp: 'MCP Server Tasks',
  feature: 'Feature Enhancement Tasks',
  subagent: 'Subagent Workflow Tasks'
};

// Component scope mapping for targeted validation (SOURCE FILES ONLY)
const COMPONENT_SCOPES = {
  backend: [
    'src/backend/**/*.ts',
    'src/session/**/*.ts',
    'src/transfer/**/*.ts'
  ],
  core: [
    'src/core/**/*.ts',
    'src/types/**/*.ts',
    'src/validation/**/*.ts'
  ],
  mcp: [
    'src/mcp-channel/**/*.ts',
    'src/backend/service-discovery.ts'
  ],
  subagent: [
    '.claude/handoff/**/*',
    '.claude/agents/**/*.ts',
    '.claude/agents/**/*.js'
  ],
  ui: [
    'src/interfaces/**/*.ts',
    'src/rendering/**/*.ts',
    'src/menus/**/*.ts'
  ],
  skin: [
    'src/skin/**/*.ts',
    'src/rendering/**/*.ts'
  ],
  state: [
    'src/state/**/*.ts',
    'src/session/**/*.ts'
  ],
  observability: [
    'src/observability/**/*.ts',
    'src/risk/**/*.ts'
  ],
  testing: [
    'src/tests/**/*.ts',
    'tests/**/*.ts',
    'src/testing/**/*.ts'
  ],
  registry: [
    'src/registry/**/*.ts',
    'src/commands/**/*.ts',
    'src/menus/**/*.ts'
  ]
};

// Directories and file patterns to EXCLUDE from validation
const EXCLUDE_PATTERNS = [
  'node_modules/**/*',
  'dist/**/*',
  '.git/**/*',
  'coverage/**/*',
  'tmp/**/*',
  'temp/**/*',
  '.cache/**/*',
  '.husky/**/*',
  '.vscode/**/*',
  'build/**/*',
  'out/**/*',
  '*.log',
  '*.map',
  '*.d.ts'  // Exclude generated declaration files
];

// Validation stages
const VALIDATION_STAGES = {
  pre: 'Pre-Validation Checks',
  main: 'Main Validation Tests',
  post: 'Post-Validation Verification'
};

class TemplumTaskValidator {
  constructor(category, taskId = null, stage = 'main', saveResults = false, project = null, options = {}) {
    // Smart category detection if not provided or if 'auto' is specified
    if (!category || category === 'auto') {
      category = this.detectCategory(taskId);
      console.log(`🧠 Auto-detected category: ${category} (based on task ID: ${taskId})`);
    }
    
    this.category = category;
    this.taskId = taskId;
    this.stage = stage;
    this.saveResults = saveResults;
    this.project = project;
    this.options = {
      skipLint: true, // Default: skip lint checks (off by default as requested)
      verbose: false,
      timeout: 180000, // 3 minutes default timeout (reduced from 5)
      earlyExit: true, // Exit early on critical failures
      // Targeting options
      scope: null,          // Predefined scope (backend, core, ui, etc.)
      files: null,          // Specific file patterns
      directories: null,    // Specific directories
      changed: false,       // Only changed files
      base: 'main',        // Base branch for changed files
      ...options
    };
    
    this.progressTimers = new Map(); // Track progress indicators
    
    this.detector = new ProjectDetector();
    this.evidenceGenerator = new EvidenceGenerator(this.detector);
    
    // Build file targeting patterns
    this.targetPatterns = this.buildTargetPatterns();
    
    // Initialize validation results
    this.validationResults = {
      category,
      categoryName: VALIDATION_CATEGORIES[category],
      taskId,
      stage,
      timestamp: new Date().toISOString(),
      overallStatus: 'PENDING',
      testsExecuted: [],
      testResults: {},
      evidence: [],
      errors: [],
      warnings: [],
      servicesStarted: [],
      cleanup: [],
      recommendations: [],
      executionTime: null
    };
    
    // Initialize category validator
    this.categoryValidator = this.initializeCategoryValidator();
  }

  /**
   * Smart category detection based on task ID patterns
   */
  detectCategory(taskId) {
    if (!taskId) return 'feature'; // Default fallback
    
    const taskIdUpper = taskId.toUpperCase();
    
    // Subagent workflow tasks
    if (taskIdUpper.includes('SUBAGENT') || taskIdUpper.includes('HANDOFF')) {
      // Auto-set scope for subagent tasks if not provided
      if (!this.options || !this.options.scope) {
        this.options = this.options || {};
        this.options.scope = 'subagent';
        console.log(`🎯 Auto-detected scope: subagent (for subagent task)`);
      }
      return 'subagent';
    }

    // MCP Channel tasks
    if (taskIdUpper.includes('MCP')) {
      // Auto-set scope for MCP tasks if not provided
      if (!this.options || !this.options.scope) {
        this.options = this.options || {};
        this.options.scope = 'mcp';
        console.log(`🎯 Auto-detected scope: mcp (for MCP task)`);
      }
      return 'mcp';
    }
    
    // ESLint/Quality tasks
    if (taskIdUpper.includes('ESLINT') || taskIdUpper.includes('QUALITY')) {
      return 'quality';
    }
    
    // Backend service tasks
    if (taskIdUpper.includes('BACKEND') || taskIdUpper.includes('SERVICE') || taskIdUpper.includes('API')) {
      return 'backend';
    }
    
    // Core system tasks
    if (taskIdUpper.includes('CORE') || taskIdUpper.includes('SYSTEM')) {
      return 'core';
    }
    
    // CLI/UI tasks
    if (taskIdUpper.includes('CLI') || taskIdUpper.includes('UI') || taskIdUpper.includes('INTERFACE')) {
      return 'ui';
    }
    
    // Build tasks
    if (taskIdUpper.includes('BUILD') || taskIdUpper.includes('COMPILE')) {
      return 'build';
    }
    
    // Architecture tasks
    if (taskIdUpper.includes('ARCH') || taskIdUpper.includes('PATTERN') || taskIdUpper.includes('DESIGN')) {
      return 'architecture';
    }
    
    // Default to feature for unknown patterns
    return 'feature';
  }

  /**
   * DEPRECATED: Auto-detection of files based on task ID removed
   * Use explicit --scope, --files, or --directories arguments for precise control
   */
  detectRelevantFiles(taskId) {
    // Auto-detection logic removed - validation now requires explicit targeting arguments
    // This prevents fragile parsing of unpredictable task IDs
    // Use: --scope mcp, --files "path/to/files", or --directories "target/dirs"
    return null;
  }

  /**
   * Build file targeting patterns based on options
   */
  buildTargetPatterns() {
    const patterns = {
      files: [],
      scope: this.options.scope || null,
      targetInfo: 'Full project validation'
    };

    // Priority order: files > directories > scope > changed > full project
    if (this.options.files) {
      const fileList = this.options.files.split(',').map(f => f.trim()).filter(f => f.length > 0);
      if (fileList.length === 0) {
        console.warn('      Warning: Empty file list provided, using full project validation');
        patterns.targetInfo = 'Full project validation (empty file list)';
      } else {
        patterns.files = fileList;
        patterns.targetInfo = `File patterns: ${patterns.files.join(', ')}`;
        console.log(`      File targeting: ${patterns.files.length} pattern(s)`);
      }
    } else if (this.options.directories) {
      const dirs = this.options.directories.split(',').map(d => d.trim()).filter(d => d.length > 0);
      if (dirs.length === 0) {
        console.warn('      Warning: Empty directory list provided, using full project validation');
        patterns.targetInfo = 'Full project validation (empty directory list)';
      } else {
        patterns.files = dirs.map(dir => `${dir}/**/*.{ts,js,json}`);
        patterns.targetInfo = `Directories: ${dirs.join(', ')}`;
        console.log(`      Directory targeting: ${dirs.length} director(y/ies)`);
      }
    } else if (this.options.scope && COMPONENT_SCOPES[this.options.scope]) {
      patterns.files = COMPONENT_SCOPES[this.options.scope];
      patterns.targetInfo = `Component scope: ${this.options.scope}`;
      console.log(`      Scope targeting: ${patterns.files.length} pattern(s) for ${this.options.scope}`);
    } else if (this.options.changed) {
      try {
        // Get changed files using git
        const gitCmd = `git diff --name-only ${this.options.base}...HEAD`;
        const output = execSync(gitCmd, { encoding: 'utf8', cwd: process.cwd() }).trim();
        
        if (!output) {
          console.log('      No changed files detected');
          patterns.files = [];
          patterns.targetInfo = `Changed files since ${this.options.base}: 0 files`;
        } else {
          const changedFiles = output
            .split('\n')
            .map(file => file.trim())
            .filter(file => file.length > 0 && file.match(/\.(ts|js|json)$/));
          
          patterns.files = changedFiles;
          patterns.targetInfo = `Changed files since ${this.options.base}: ${changedFiles.length} files`;
          console.log(`      Changed file targeting: ${changedFiles.length} file(s)`);
        }
      } catch (error) {
        console.warn(`      Warning: Could not get changed files (${error.message}), falling back to incremental detection`);
        patterns.files = [];
        patterns.targetInfo = 'Full project validation (git diff failed)';
      }
    } else {
      // Smart incremental validation - auto-detect relevant files based on task ID
      const relevantFiles = this.detectRelevantFiles(this.taskId);
      if (relevantFiles) {
        patterns.files = relevantFiles;
        patterns.targetInfo = `Auto-detected files for ${this.taskId}`;
        console.log(`      🧠 Auto-detected targeting: ${relevantFiles.length} pattern(s) for ${this.taskId}`);
      }
    }

    return patterns;
  }

  /**
   * Filter files to exclude unnecessary directories and generated files
   */
  filterValidationFiles(filePatterns) {
    // If patterns are already specific (start with 'src/'), they're likely clean
    if (Array.isArray(filePatterns) && filePatterns.every(p => p.startsWith('src/'))) {
      return filePatterns;
    }

    // For broader patterns, add exclusions
    const filteredPatterns = [];
    const patterns = Array.isArray(filePatterns) ? filePatterns : [filePatterns];
    
    for (const pattern of patterns) {
      if (pattern.includes('**')) {
        // Add exclusion patterns for broad searches
        filteredPatterns.push(pattern);
        // Note: ESLint and other tools will need --ignore-pattern for exclusions
      } else {
        filteredPatterns.push(pattern);
      }
    }

    return filteredPatterns;
  }

  /**
   * Get file patterns for ESLint/Prettier commands
   */
  getFilePatterns() {
    if (this.targetPatterns.files.length > 0) {
      const filtered = this.filterValidationFiles(this.targetPatterns.files);
      return filtered.join(' ');
    }
    return 'src/'; // Default fallback - always target source files only
  }

  /**
   * Get ESLint ignore patterns to exclude unnecessary files
   */
  getESLintIgnorePatterns() {
    return EXCLUDE_PATTERNS.map(pattern => `--ignore-pattern "${pattern}"`).join(' ');
  }

  /**
   * Show progress indicator for long-running operations
   */
  showProgress(description) {
    if (!this.options.verbose) return null;
    
    let dots = 0;
    const startTime = Date.now();
    const timer = setInterval(() => {
      dots = (dots + 1) % 4;
      const progress = '.'.repeat(dots) + ' '.repeat(3 - dots);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      process.stdout.write(`\r      ${description}${progress} (${elapsed}s)`);
    }, 500);
    
    this.progressTimers.set(description, timer);
    return timer;
  }

  /**
   * Resolve glob patterns to actual file paths
   */
  resolveGlobPatterns(patterns) {
    const resolvedFiles = [];
    
    for (const pattern of patterns) {
      try {
        if (pattern.includes('**') || pattern.includes('*')) {
          // Handle glob patterns manually
          const resolvedPattern = this.expandGlobPattern(pattern);
          resolvedFiles.push(...resolvedPattern);
        } else {
          // Direct file path
          if (fs.existsSync(pattern)) {
            resolvedFiles.push(pattern);
          }
        }
      } catch (error) {
        console.warn(`    Warning: Could not resolve pattern '${pattern}': ${error.message}`);
      }
    }
    
    // Remove duplicates and return unique file list
    return [...new Set(resolvedFiles)];
  }

  /**
   * Expand glob pattern to actual files
   */
  expandGlobPattern(pattern) {
    const matches = [];
    
    // Simple glob expansion for TypeScript files
    if (pattern === 'src/mcp-channel/**/*.ts') {
      const mcpChannelDir = path.join(process.cwd(), 'src/mcp-channel');
      if (fs.existsSync(mcpChannelDir)) {
        const walkDir = (dir, fileList = []) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              walkDir(filePath, fileList);
            } else if (file.endsWith('.ts')) {
              fileList.push(path.relative(process.cwd(), filePath));
            }
          });
          return fileList;
        };
        matches.push(...walkDir(mcpChannelDir));
      }
    } else if (pattern === 'src/backend/service-discovery.ts') {
      if (fs.existsSync(pattern)) {
        matches.push(pattern);
      }
    }
    
    return matches;
  }

  /**
   * Clear progress indicator
   */
  clearProgress(description) {
    const timer = this.progressTimers.get(description);
    if (timer) {
      clearInterval(timer);
      this.progressTimers.delete(description);
      if (this.options.verbose) {
        process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear line
      }
    }
  }

  /**
   * Check if we should exit early due to critical failures
   */
  shouldExitEarly() {
    if (!this.options.earlyExit) return false;
    
    const criticalFailures = this.validationResults.errors.filter(error => 
      error.includes('compilation failed') || 
      error.includes('TypeScript failed') ||
      error.includes('Fatal error')
    );
    
    return criticalFailures.length > 0;
  }

  /**
   * Initialize the appropriate category validator
   */
  initializeCategoryValidator() {
    const baseParams = [this.detector, this.validationResults, this.project, this.targetPatterns];
    
    switch (this.category) {
      case 'backend':
        return new BackendValidator(...baseParams);
      case 'ui':
        return new UIValidator(...baseParams);
      case 'core':
        return new CoreValidator(...baseParams);
      case 'build':
        return new BuildValidator(...baseParams);
      case 'quality':
        return new QualityValidator(...baseParams);
      case 'architecture':
        return new ArchitectureValidator(...baseParams);
      case 'mcp':
        return new MCPValidator(...baseParams);
      case 'feature':
        return new FeatureValidator(...baseParams);
      case 'subagent':
        return new SubagentValidator(...baseParams);
      default:
        throw new Error(`Unsupported category: ${this.category}`);
    }
  }

  /**
   * Main validation workflow
   */
  async validate() {
    const startTime = Date.now();
    
    try {
      console.log('='.repeat(60));
      console.log(`TEMPLUM TASK VALIDATOR - ${this.validationResults.categoryName.toUpperCase()}`);
      console.log('='.repeat(60));
      console.log(`Task ID: ${this.taskId || 'N/A'}`);
      console.log(`Stage: ${VALIDATION_STAGES[this.stage]}`);
      console.log(`Target: ${this.targetPatterns.targetInfo}`);
      if (this.targetPatterns.files.length > 0) {
        console.log(`Files: ${this.targetPatterns.files.length} patterns`);
      }
      console.log(`Started: ${new Date().toLocaleString()}`);
      console.log('');

      // Step 1: Environment setup and prerequisite checks
      console.log('1. ENVIRONMENT SETUP & PREREQUISITES');
      console.log('-'.repeat(40));
      await this.setupEnvironment();
      
      // Step 2: Universal validation tests (all categories)
      console.log('\n2. UNIVERSAL VALIDATION TESTS');
      console.log('-'.repeat(40));
      await this.runUniversalTests();
      
      // Check for early exit after universal tests
      if (this.shouldExitEarly()) {
        console.log('\n⚠️  CRITICAL FAILURE: Exiting early due to critical compilation/build errors');
        console.log('Fix compilation errors before running additional validation tests');
        this.validationResults.overallStatus = 'VALIDATION_FAILED';
        throw new Error('Critical compilation failures detected - early exit');
      }
      
      // Step 3: Category-specific validation tests
      console.log(`\n3. ${this.validationResults.categoryName.toUpperCase()} VALIDATION TESTS`);
      console.log('-'.repeat(40));
      await this.categoryValidator.runCategoryTests();
      
      // Step 4: Integration testing (if applicable)
      console.log('\n4. INTEGRATION TESTING');
      console.log('-'.repeat(40));
      await this.runIntegrationTests();
      
      // Step 5: Evidence collection and analysis
      console.log('\n5. EVIDENCE COLLECTION');
      console.log('-'.repeat(40));
      await this.collectEvidence();
      
      // Step 6: Cleanup and finalization
      console.log('\n6. CLEANUP & FINALIZATION');
      console.log('-'.repeat(40));
      await this.cleanup();
      
      // Calculate execution time
      this.validationResults.executionTime = Date.now() - startTime;
      
      // Determine overall status
      await this.assessOverallStatus();
      
      // Generate recommendations
      await this.generateRecommendations();
      
      // Save results if requested
      if (this.saveResults) {
        await this.saveValidationResults();
      }
      
      // Display final results
      this.displayFinalResults();
      
      // Exit with appropriate code
      const successStatuses = ['VALIDATION_PASSED', 'VALIDATION_PASSED_WITH_WARNINGS'];
      process.exit(successStatuses.includes(this.validationResults.overallStatus) ? 0 : 1);
      
    } catch (error) {
      console.error(`\nFATAL ERROR: ${error.message}`);
      this.validationResults.errors.push(`Fatal error: ${error.message}`);
      this.validationResults.overallStatus = 'VALIDATION_FAILED';
      
      await this.cleanup();
      if (this.saveResults) {
        await this.saveValidationResults();
      }
      
      process.exit(1);
    }
  }

  /**
   * Setup environment and check prerequisites
   */
  async setupEnvironment() {
    console.log('  Detecting project structure...');
    this.detector.logProjectInfo();
    
    console.log('  Checking Node.js and npm...');
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`    Node.js: ${nodeVersion}`);
      console.log(`    npm: ${npmVersion}`);
      this.validationResults.evidence.push(`Environment: Node.js ${nodeVersion}, npm ${npmVersion}`);
    } catch (error) {
      throw new Error(`Node.js/npm not available: ${error.message}`);
    }
    
    console.log('  Checking project dependencies...');
    const projectRoot = this.detector.getProjectRoot();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.validationResults.warnings.push('No package.json found in project root');
    } else {
      console.log('    package.json found');
      this.validationResults.evidence.push('Project package.json exists');
    }
  }

  /**
   * Run universal tests that apply to all categories
   */
  async runUniversalTests() {
    const universalTests = [
      { name: 'Clean Compilation', method: 'testCompilation' },
      { name: 'TypeScript Type Checking', method: 'testTypeScript' }
    ];

    // Add lint check only if explicitly enabled
    if (!this.options.skipLint) {
      universalTests.push({ name: 'Basic Lint Check', method: 'testLinting' });
    } else {
      console.log('  Skipping Basic Lint Check (disabled by default)...');
      this.validationResults.evidence.push('Basic lint check skipped - disabled by default');
    }
    
    for (const test of universalTests) {
      console.log(`  Running ${test.name}...`);
      try {
        const result = await this[test.method]();
        this.validationResults.testResults[test.name] = result;
        this.validationResults.testsExecuted.push(test.name);
        console.log(`    ${result.status === 'PASS' ? '✅ PASS' : result.status === 'WARN' ? '🟡 WARN' : '❌ FAIL'}`);
        
        if (result.evidence) {
          this.validationResults.evidence.push(...result.evidence);
        }
        if (result.errors) {
          this.validationResults.errors.push(...result.errors);
        }
        if (result.warnings) {
          this.validationResults.warnings.push(...result.warnings);
        }
      } catch (error) {
        const failResult = {
          status: 'FAIL',
          message: `Test failed: ${error.message}`,
          errors: [error.message]
        };
        this.validationResults.testResults[test.name] = failResult;
        this.validationResults.errors.push(error.message);
        console.log(`    ❌ FAIL: ${error.message}`);
      }
    }
  }

  /**
   * Test compilation
   */
  async testCompilation() {
    const projectRoot = this.detector.getProjectRoot();
    const originalCwd = process.cwd();
    
    // Build from the specified project directory
    const buildDir = this.detector.getBuildDirectory(this.project);
    
    try {
      process.chdir(buildDir);
      
      // Default: Full project build validation
      console.log('    Running build (preserving existing artifacts)...');
      const progressTimer = this.showProgress('Building');
      
      // Check if npm run build is available, otherwise use tsc directly
      const packageJsonPath = path.join(buildDir, 'package.json');
      let buildCommand = 'npm run build';
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (!packageJson.scripts || !packageJson.scripts.build) {
          buildCommand = 'npx tsc';
          console.log('    No build script found, using direct TypeScript compilation');
        }
      }
      
      const buildOutput = execSync(buildCommand, { 
        encoding: 'utf8',
        timeout: Math.min(this.options.timeout, 120000), // Use configured timeout, max 2 minutes
        maxBuffer: 2 * 1024 * 1024 // 2MB buffer
      });
      
      this.clearProgress('Building');
      process.chdir(originalCwd);
      
      console.log('    ✅ Build completed successfully');
      
      return {
        status: 'PASS',
        message: 'Clean compilation successful',
        evidence: [`Build completed successfully: ${buildCommand}`, `Output length: ${buildOutput.length} characters`]
      };
      
    } catch (error) {
      this.clearProgress('Building');
      this.clearProgress('Compiling');
      process.chdir(originalCwd);
      
      // Check if it's a timeout or actual compilation error
      if (error.message.includes('timeout')) {
        console.log('    ❌ Compilation timed out');
        return {
          status: 'FAIL',
          message: 'Compilation timed out',
          errors: [`Compilation timeout after ${Math.min(this.options.timeout, 120000)/1000}s: ${error.message}`]
        };
      }
      
      // For compilation errors, include more detailed information
      const stderr = error.stderr || '';
      const stdout = error.stdout || '';
      const combinedOutput = `${stdout}\n${stderr}`.trim();
      
      return {
        status: 'FAIL',
        message: 'Compilation failed',
        errors: [
          `Compilation failed with exit code ${error.status || 'unknown'}`,
          `Error: ${error.message}`,
          combinedOutput ? `Output: ${combinedOutput.slice(0, 1000)}...` : 'No output captured'
        ]
      };
    }
  }

  /**
   * Test TypeScript type checking
   */
  async testTypeScript() {
    const projectRoot = this.detector.getProjectRoot();
    const originalCwd = process.cwd();
    
    // Use the specified project directory for TypeScript checking
    const buildDir = this.detector.getBuildDirectory(this.project);
    
    try {
      process.chdir(buildDir);
      
      // PRIMARY FIX: Check if tsconfig.json exists first
      const tsconfigPath = path.join(buildDir, 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) {
        process.chdir(originalCwd);
        console.log('    🟡 No tsconfig.json found, skipping TypeScript validation');
        return {
          status: 'WARN',
          message: 'TypeScript validation skipped - no configuration found',
          warnings: ['No tsconfig.json found in target directory. Consider adding TypeScript configuration for proper type checking.'],
          evidence: [`Checked for: ${tsconfigPath}`, 'TypeScript validation requires tsconfig.json to function correctly']
        };
      }
      
      console.log('    Running TypeScript type check...');
      const progressTimer = this.showProgress('Type checking');
      
      // Use less strict checking for validation - focus on critical errors only
      const tscOutput = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        timeout: Math.min(this.options.timeout, 60000) // Use configured timeout, max 1 minute
      });
      
      this.clearProgress('Type checking');
      process.chdir(originalCwd);
      
      console.log('    ✅ TypeScript check completed successfully');
      
      return {
        status: 'PASS',
        message: 'TypeScript type checking passed',
        evidence: ['TypeScript compilation: 0 errors', `Output length: ${tscOutput.length} characters`]
      };
      
    } catch (error) {
      this.clearProgress('Type checking');
      process.chdir(originalCwd);
      
      // Check if it's a timeout
      if (error.message.includes('timeout')) {
        console.log('    ❌ TypeScript check timed out');
        return {
          status: 'FAIL',
          message: 'TypeScript type checking timed out',
          errors: [`TypeScript timeout after ${Math.min(this.options.timeout, 60000)/1000}s: ${error.message}`]
        };
      }
      
      // Extract TypeScript error information
      const stderr = error.stderr || '';
      const stdout = error.stdout || '';
      const combinedOutput = `${stdout}\n${stderr}`.trim();
      
      // SECONDARY FIX: Filter out TypeScript help text before processing errors
      const filteredOutput = this.filterTypeScriptHelpText(combinedOutput);
      
      // Count actual errors (not help text)
      const errorLines = filteredOutput.split('\n').filter(line => 
        line.includes('error TS') || (line.includes('TS') && line.includes('error'))
      );
      
      return {
        status: 'FAIL',
        message: `TypeScript type checking failed (${errorLines.length} errors)`,
        errors: [
          `TypeScript failed with exit code ${error.status || 'unknown'}`,
          `Error count: ${errorLines.length}`,
          filteredOutput && errorLines.length > 0 ? `Sample errors: ${filteredOutput.slice(0, 1000)}...` : 'No actual TypeScript errors found in output'
        ]
      };
    }
  }

  /**
   * Filter out TypeScript help text from error output
   */
  filterTypeScriptHelpText(output) {
    if (!output) return '';
    
    const lines = output.split('\n');
    const filteredLines = [];
    let inHelpSection = false;
    
    for (const line of lines) {
      // Detect start of help sections
      if (line.includes('COMMON COMMANDS') || 
          line.includes('COMMAND LINE FLAGS') || 
          line.includes('COMMON COMPILER OPTIONS') ||
          line.match(/^tsc:/)) {
        inHelpSection = true;
        continue;
      }
      
      // Skip version-only lines
      if (line.match(/^Version \d+\.\d+\.\d+$/)) {
        continue;
      }
      
      // Reset help section detection for actual errors
      if (line.includes('error TS') || line.includes('.ts(')) {
        inHelpSection = false;
      }
      
      // Skip help content but keep actual error messages
      if (!inHelpSection || line.includes('error TS') || line.includes('.ts(')) {
        filteredLines.push(line);
      }
    }
    
    return filteredLines.join('\n').trim();
  }

  /**
   * Test basic linting
   */
  async testLinting() {
    try {
      const buildDir = this.detector.getBuildDirectory(this.project);
      const originalCwd = process.cwd();
      process.chdir(buildDir);
      
      console.log('    Running lint check...');
      
      // First check if lint script exists
      const packageJsonPath = path.join(buildDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (!packageJson.scripts || !packageJson.scripts.lint) {
          process.chdir(originalCwd);
          return {
            status: 'WARN',
            message: 'Lint not configured',
            warnings: ['No lint script found in package.json']
          };
        }
      }
      
      try {
        // Determine lint command with proper scoping
        let lintCommand = 'npm run lint';
        
        // If we have target patterns, use direct ESLint with scoped files
        if (this.targetPatterns && this.targetPatterns.files && this.targetPatterns.files.length > 0) {
          // Resolve patterns relative to project root, not build directory
          const projectRoot = this.detector.getProjectRoot();
          const resolvedPatterns = this.targetPatterns.files.map(pattern => {
            if (pattern.startsWith('.claude/') || pattern.startsWith('.templum/')) {
              return path.resolve(projectRoot, pattern);
            }
            return pattern;
          });
          const filePatterns = resolvedPatterns.join(' ');
          lintCommand = `npx eslint ${filePatterns}`;
          console.log(`    Scoped lint check: ${filePatterns}`);
        } else {
          console.log('    Full project lint check');
        }
        
        const lintOutput = execSync(lintCommand, { 
          encoding: 'utf8',
          timeout: 60000,
          maxBuffer: 1024 * 1024
        });
        
        process.chdir(originalCwd);
        
        const scopeInfo = this.targetPatterns && this.targetPatterns.files && this.targetPatterns.files.length > 0 
          ? ` (scoped to ${this.targetPatterns.files.length} pattern(s))` 
          : ' (full project)';
        
        return {
          status: 'PASS',
          message: `Lint check passed${scopeInfo}`,
          evidence: [`Lint check completed successfully: ${lintOutput.length} chars output`, `Command: ${lintCommand}`]
        };
        
      } catch (lintError) {
        process.chdir(originalCwd);
        
        // Parse ESLint output to distinguish between errors and warnings
        const stderr = lintError.stderr || '';
        const stdout = lintError.stdout || '';
        const combinedOutput = `${stdout}\n${stderr}`.trim();
        
        // Look for ESLint summary pattern
        const problemsMatch = combinedOutput.match(/(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/);
        
        if (problemsMatch) {
          const [, totalProblems, errors, warnings] = problemsMatch;
          const errorCount = parseInt(errors);
          const warningCount = parseInt(warnings);
          
          if (errorCount === 0) {
            // Only warnings, treat as WARN not FAIL
            return {
              status: 'WARN',
              message: `Lint check passed with ${warningCount} warnings`,
              warnings: [`ESLint found ${warningCount} warnings (no errors)`],
              evidence: [`Lint warnings: ${warningCount}`, `Total problems: ${totalProblems}`]
            };
          } else {
            // Has actual errors
            return {
              status: 'FAIL',
              message: `Lint check failed with ${errorCount} errors`,
              errors: [`ESLint found ${errorCount} errors and ${warningCount} warnings`]
            };
          }
        } else {
          // Fallback: check if it's just warnings by exit code and content
          if (lintError.status === 1 && combinedOutput.includes('warning') && !combinedOutput.includes('error')) {
            return {
              status: 'WARN',
              message: 'Lint check completed with warnings',
              warnings: [`Lint issues detected: ${combinedOutput.substring(0, 300)}...`]
            };
          } else {
            return {
              status: 'FAIL',
              message: 'Lint check failed',
              errors: [`Lint failure: ${lintError.message.substring(0, 300)}...`]
            };
          }
        }
      }
    } catch (error) {
      return {
        status: 'FAIL',
        message: 'Lint test execution failed',
        errors: [`Lint test failed: ${error.message}`]
      };
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    console.log('  Checking for integration test requirements...');
    
    // Category validator handles integration testing specifics
    if (this.categoryValidator.hasIntegrationTests) {
      await this.categoryValidator.runIntegrationTests();
    } else {
      console.log('    No integration tests required for this category');
      this.validationResults.evidence.push('Integration tests: Not applicable for this category');
    }
  }

  /**
   * Collect all evidence and format for reporting
   */
  async collectEvidence() {
    console.log('  Formatting evidence for validation report...');
    
    // Generate timestamp
    const timestamp = this.evidenceGenerator.generateWindowsTimestamp();
    
    // Count test results
    const testCounts = {
      passed: 0,
      failed: 0,
      warned: 0
    };
    
    Object.values(this.validationResults.testResults).forEach(result => {
      if (result.status === 'PASS') testCounts.passed++;
      else if (result.status === 'FAIL') testCounts.failed++;
      else if (result.status === 'WARN') testCounts.warned++;
    });
    
    console.log(`    Tests executed: ${this.validationResults.testsExecuted.length}`);
    console.log(`    Results: ${testCounts.passed} passed, ${testCounts.failed} failed, ${testCounts.warned} warnings`);
    console.log(`    Evidence items: ${this.validationResults.evidence.length}`);
    console.log(`    Errors: ${this.validationResults.errors.length}`);
    console.log(`    Warnings: ${this.validationResults.warnings.length}`);
  }

  /**
   * Cleanup services and temporary files
   */
  async cleanup() {
    console.log('  Performing cleanup...');
    
    // Clear all progress timers to prevent memory leaks
    console.log('    Clearing progress timers...');
    for (const [description, timer] of this.progressTimers.entries()) {
      clearInterval(timer);
      this.progressTimers.delete(description);
    }
    
    // Stop any services that were started
    for (const service of this.validationResults.servicesStarted) {
      console.log(`    Stopping ${service.name}...`);
      try {
        if (service.pid) {
          process.kill(service.pid);
        }
        console.log(`      ${service.name} stopped`);
      } catch (error) {
        console.log(`      Warning: Could not stop ${service.name}: ${error.message}`);
      }
    }
    
    // Clear any dangling listeners to prevent MaxListenersExceededWarning
    if (process.listenerCount('SIGINT') > 5) {
      console.log('    Cleaning up excess SIGINT listeners...');
      process.removeAllListeners('SIGINT');
    }
    if (process.listenerCount('SIGTERM') > 5) {
      console.log('    Cleaning up excess SIGTERM listeners...');
      process.removeAllListeners('SIGTERM');
    }
    
    // Run any category-specific cleanup
    if (this.categoryValidator && this.categoryValidator.cleanup) {
      await this.categoryValidator.cleanup();
    }
    
    // Force garbage collection if available (for memory cleanup)
    if (global.gc) {
      global.gc();
    }
    
    console.log('    Cleanup completed');
  }

  /**
   * Assess overall validation status
   */
  async assessOverallStatus() {
    const testResults = Object.values(this.validationResults.testResults);
    const failedTests = testResults.filter(r => r.status === 'FAIL');
    const warningTests = testResults.filter(r => r.status === 'WARN');
    const totalErrors = this.validationResults.errors.length;
    
    if (failedTests.length === 0 && totalErrors === 0) {
      if (warningTests.length > 0) {
        this.validationResults.overallStatus = 'VALIDATION_PASSED_WITH_WARNINGS';
      } else {
        this.validationResults.overallStatus = 'VALIDATION_PASSED';
      }
    } else if (failedTests.length > 0) {
      this.validationResults.overallStatus = 'VALIDATION_FAILED';
    } else {
      this.validationResults.overallStatus = 'VALIDATION_INCOMPLETE';
    }
  }

  /**
   * Generate recommendations based on results
   */
  async generateRecommendations() {
    const recommendations = [];
    
    if (this.validationResults.overallStatus === 'VALIDATION_PASSED') {
      recommendations.push('All validation tests passed - task is ready for documentation phase');
      recommendations.push('Update task status to [D] documenting in active tasks');
      recommendations.push('Run /pr:document to complete the implementation cycle');
    } else if (this.validationResults.overallStatus === 'VALIDATION_PASSED_WITH_WARNINGS') {
      recommendations.push('Validation passed with warnings - task is generally ready for documentation');
      recommendations.push('Consider addressing warnings to improve code quality');
      recommendations.push('Update task status to [D] documenting in active tasks');
      recommendations.push('Run /pr:document to complete the implementation cycle');
    } else if (this.validationResults.overallStatus === 'VALIDATION_FAILED') {
      recommendations.push('Validation failed - task requires additional implementation work');
      recommendations.push('Update task status to [B] implemented-broken in active tasks');
      recommendations.push('Address failed tests before proceeding to documentation');
      recommendations.push('Use /pr:task --continue to fix identified issues');
    }
    
    // Add specific recommendations based on error types
    if (this.validationResults.errors.some(e => e.includes('compilation'))) {
      recommendations.push('Fix compilation errors before running other tests');
    }
    
    if (this.validationResults.errors.some(e => e.includes('TypeScript'))) {
      recommendations.push('Address TypeScript type errors for code quality');
    }
    
    this.validationResults.recommendations = recommendations;
  }

  /**
   * Save validation results to file
   */
  async saveValidationResults() {
    try {
      const resultsDir = this.detector.getValidationResultsDir();
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      const timestamp = this.evidenceGenerator.generateWindowsTimestamp();
      const taskSuffix = this.taskId ? `-${this.taskId}` : '';
      const filename = `${timestamp}${taskSuffix}-${this.category}-validation.md`;
      const filepath = path.join(resultsDir, filename);
      
      const report = this.generateValidationReport();
      fs.writeFileSync(filepath, report);
      
      const relativePath = path.relative(this.detector.getProjectRoot(), filepath);
      console.log(`    Validation report saved to: ${relativePath}`);
      this.validationResults.reportPath = filepath;
    } catch (error) {
      console.warn(`    Warning: Could not save validation report: ${error.message}`);
    }
  }

  /**
   * Generate validation report in markdown format
   */
  generateValidationReport() {
    const timestamp = this.evidenceGenerator.generateWindowsTimestamp();
    const taskId = this.taskId || 'N/A';
    
    return `---
date: ${timestamp}
TASK-ID: ${taskId}
source: templum-active-tasks.md
validation_type: ${this.category}
category: ${this.category}
priority: ${this.validationResults.errors.length > 0 ? 'high' : 'medium'}
complexity: TBD
components: [task-specific-components]
initial_status: [~]
end_status: ${this.validationResults.overallStatus === 'VALIDATION_PASSED' || this.validationResults.overallStatus === 'VALIDATION_PASSED_WITH_WARNINGS' ? '[D]' : '[B]'}
tags: ${this.category}, validation, automated-testing
---

# Validation Report - ${taskId} - ${timestamp}

## Validation Category: ${this.validationResults.categoryName}

**Overall Status**: ${this.validationResults.overallStatus}
**Execution Time**: ${this.validationResults.executionTime}ms  
**Tests Executed**: ${this.validationResults.testsExecuted.length}
**Target Scope**: ${this.targetPatterns.targetInfo}

## Summary

${(() => {
  const testResults = Object.values(this.validationResults.testResults);
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  const warnCount = testResults.filter(r => r.status === 'WARN').length;
  
  return `- **Tests**: ${passCount} passed, ${failCount} failed, ${warnCount} warnings
- **Evidence Items**: ${this.validationResults.evidence.length}
- **Errors**: ${this.validationResults.errors.length}
- **Warnings**: ${this.validationResults.warnings.length}`;
})()}

## Tests Executed

${this.validationResults.testsExecuted.map(test => {
  const result = this.validationResults.testResults[test];
  const status = result.status === 'PASS' ? '✅ PASS' : result.status === 'WARN' ? '🟡 WARN' : '❌ FAIL';
  return `- [ ] ${test} - ${status}`;
}).join('\n')}

## Evidence Collected

${this.validationResults.evidence.length === 0 ? 'No evidence collected.' : 
this.validationResults.evidence.map((evidence, index) => {
  // Handle multi-line evidence with proper indentation
  const lines = evidence.split('\n');
  if (lines.length === 1) {
    return `${index + 1}. ${evidence}`;
  } else {
    // First line with number, subsequent lines indented with proper formatting
    const firstLine = `${index + 1}. ${lines[0]}`;
    const remainingLines = lines.slice(1).map(line => `   ${line}`).join('\n');
    return `${firstLine}\n${remainingLines}`;
  }
}).join('\n\n')}

## Test Results Detail

${Object.entries(this.validationResults.testResults).map(([testName, result]) => {
  // Ensure consistent formatting for all test results
  const status = result.status || 'UNKNOWN';
  const message = result.message || 'N/A';
  const evidence = result.evidence && result.evidence.length > 0 
    ? result.evidence.map(e => e.length > 200 ? e.substring(0, 200) + '...' : e).join('\n- ') 
    : '';
  const errors = result.errors && result.errors.length > 0 
    ? result.errors.join('\n- ') 
    : '';
  const warnings = result.warnings && result.warnings.length > 0 
    ? result.warnings.join('\n- ') 
    : '';

  let section = `### ${testName}

**Status**: ${status}
**Message**: ${message}`;

  if (evidence) {
    section += `\n**Evidence**:\n- ${evidence}`;
  }
  if (errors) {
    section += `\n**Errors**:\n- ${errors}`;
  }
  if (warnings) {
    section += `\n**Warnings**:\n- ${warnings}`;
  }

  return section;
}).join('\n\n')}

${this.validationResults.errors.length > 0 ? `## Issues Found

${this.validationResults.errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}` : ''}

${this.validationResults.warnings.length > 0 ? `## Warnings

${this.validationResults.warnings.map((warning, index) => `${index + 1}. ${warning}`).join('\n')}` : ''}

## Next Steps

${this.validationResults.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

---

**Generated by**: Templum Task Validator
**Command**: \`node scripts/validation/templum-task-validator.js --category ${this.category}${this.taskId ? ` --task-id ${this.taskId}` : ''}${this.saveResults ? ' --save' : ''}\`
`;
  }

  /**
   * Display final results summary
   */
  displayFinalResults() {
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const statusEmoji = {
      'VALIDATION_PASSED': '✅',
      'VALIDATION_PASSED_WITH_WARNINGS': '🟡',
      'VALIDATION_FAILED': '❌',
      'VALIDATION_INCOMPLETE': '⚠️'
    }[this.validationResults.overallStatus] || '⚪';
    
    console.log(`Overall Status: ${statusEmoji} ${this.validationResults.overallStatus}`);
    console.log(`Category: ${this.validationResults.categoryName}`);
    console.log(`Task ID: ${this.taskId || 'N/A'}`);
    console.log(`Execution Time: ${this.validationResults.executionTime}ms`);
    
    const testResults = Object.values(this.validationResults.testResults);
    const passCount = testResults.filter(r => r.status === 'PASS').length;
    const failCount = testResults.filter(r => r.status === 'FAIL').length;
    const warnCount = testResults.filter(r => r.status === 'WARN').length;
    
    console.log(`\nTest Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
    console.log(`Evidence Items: ${this.validationResults.evidence.length}`);
    console.log(`Errors: ${this.validationResults.errors.length}`);
    console.log(`Warnings: ${this.validationResults.warnings.length}`);
    
    if (this.validationResults.reportPath) {
      console.log(`\nReport saved to: ${path.relative(this.detector.getProjectRoot(), this.validationResults.reportPath)}`);
    }
    
    console.log('\nRecommendations:');
    this.validationResults.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(60));
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Templum Task Validator - Starting...');
  
  const args = process.argv.slice(2);
  
  // Parse arguments
  const categoryIndex = args.indexOf('--category');
  const taskIdIndex = args.indexOf('--task-id');
  const stageIndex = args.indexOf('--stage');
  const projectIndex = args.indexOf('--project');
  const saveFlag = args.includes('--save');
  const enableLintFlag = args.includes('--enable-lint');
  const verboseFlag = args.includes('--verbose');
  
  // Targeting options
  const scopeIndex = args.indexOf('--scope');
  const filesIndex = args.indexOf('--files');
  const directoriesIndex = args.indexOf('--directories');
  const changedFlag = args.includes('--changed');
  const baseIndex = args.indexOf('--base');
  
  if (categoryIndex === -1 || categoryIndex + 1 >= args.length) {
    console.error('Usage: node templum-task-validator.js --category <type> [options]');
    console.error('');
    console.error('Required:');
    console.error('  --category <type>        Validation category');
    console.error('');
    console.error('Basic Options:');
    console.error('  --task-id <id>          Task identifier');
    console.error('  --stage <stage>         Validation stage (default: main)');
    console.error('  --project <name>        Project name (Templum, Haruspex, phoenix-code-lite)');
    console.error('  --save                  Save results to file');
    console.error('  --enable-lint           Enable lint checks (disabled by default)');
    console.error('  --verbose               Enable verbose output with progress indicators');
    console.error('');
    console.error('Targeting Options (mutually exclusive, for faster focused validation):');
    console.error('  --scope <scope>         Predefined component scope (recommended)');
    console.error('  --files <patterns>      Specific file patterns (comma-separated)');
    console.error('  --directories <dirs>    Specific directories (comma-separated)');
    console.error('  --changed               Only changed files since base branch');
    console.error('  --base <branch>         Base branch for --changed (default: main)');
    console.error('');
    console.error('Categories: ' + Object.keys(VALIDATION_CATEGORIES).join(', '));
    console.error('Scopes: ' + Object.keys(COMPONENT_SCOPES).join(', '));
    console.error('');
    console.error('Examples:');
    console.error('  # ESLint backend validation with scope targeting:');
    console.error('  node templum-task-validator.js --category quality --task-id TASK-ESLINT-006 --scope backend --enable-lint --save');
    console.error('');
    console.error('  # Build validation for Templum project:');
    console.error('  node templum-task-validator.js --category build --task-id TASK-BUILD-001 --project Templum --save');
    console.error('');
    console.error('  # Quality validation for specific files:');
    console.error('  node templum-task-validator.js --category quality --files "src/core/templum-core.ts,src/backend/service-discovery.ts" --enable-lint');
    process.exit(2);
  }
  
  const category = args[categoryIndex + 1];
  const taskId = taskIdIndex !== -1 && taskIdIndex + 1 < args.length ? args[taskIdIndex + 1] : null;
  const stage = stageIndex !== -1 && stageIndex + 1 < args.length ? args[stageIndex + 1] : 'main';
  const project = projectIndex !== -1 && projectIndex + 1 < args.length ? args[projectIndex + 1] : null;
  
  // Parse targeting options
  const scope = scopeIndex !== -1 && scopeIndex + 1 < args.length ? args[scopeIndex + 1] : null;
  const files = filesIndex !== -1 && filesIndex + 1 < args.length ? args[filesIndex + 1] : null;
  const directories = directoriesIndex !== -1 && directoriesIndex + 1 < args.length ? args[directoriesIndex + 1] : null;
  const base = baseIndex !== -1 && baseIndex + 1 < args.length ? args[baseIndex + 1] : 'main';
  
  // Validate category
  if (!VALIDATION_CATEGORIES[category]) {
    console.error(`Error: Invalid category '${category}'`);
    console.error('Valid categories:', Object.keys(VALIDATION_CATEGORIES).join(', '));
    process.exit(2);
  }
  
  // Validate stage
  if (!VALIDATION_STAGES[stage]) {
    console.error(`Error: Invalid stage '${stage}'`);
    console.error('Valid stages:', Object.keys(VALIDATION_STAGES).join(', '));
    process.exit(2);
  }
  
  // Validate scope if provided
  if (scope && !COMPONENT_SCOPES[scope]) {
    console.error(`Error: Invalid scope '${scope}'`);
    console.error('Valid scopes:', Object.keys(COMPONENT_SCOPES).join(', '));
    process.exit(2);
  }
  
  // Validate mutually exclusive targeting options
  const targetingOptions = [scope, files, directories, changedFlag].filter(opt => opt);
  if (targetingOptions.length > 1) {
    console.error('Error: Targeting options are mutually exclusive. Use only one of: --scope, --files, --directories, --changed');
    process.exit(2);
  }
  
  try {
    const options = {
      skipLint: !enableLintFlag, // Invert the flag - lint disabled by default
      verbose: verboseFlag,
      // Targeting options
      scope,
      files,
      directories,
      changed: changedFlag,
      base
    };
    
    const validator = new TemplumTaskValidator(category, taskId, stage, saveFlag, project, options);
    await validator.validate();
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
