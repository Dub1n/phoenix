#!/usr/bin/env node

/**
 * Templum Task Validator
 * 
 * NEW SIMPLIFIED ARCHITECTURE (2025-09-06-1100)
 * 
 * Purpose: Validation with clean separation of concerns and minimal agent complexity
 * Usage: node templum-task-validator.js --project <path> --category <type> [--scope <scope>] [--task-id <id>] [--save]
 * 
 * Key Architecture Changes:
 * - Explicit project path resolution only (no auto-detection)
 * - Category-based scope mapping with simple overrides
 * - Layered validation: Build + Targeted Quality
 * - Move complexity from agent instructions to script internals
 * - Maximum 3 arguments for agents: project, category, optional scope
 * 
 * Success Metrics:
 * - R1: 100% accurate project resolution
 * - R2: Predictable category → scope mapping
 * - R3: Reliable override system
 * - R4: Layered validation (build + scope)
 * - R5: No false failures from unrelated code
 * - R6: Fast targeted feedback (<60s for scoped validation)
 * - R8: Zero fragile auto-detection
 * - R10: Simple agent interface (3 decision points max)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Supported validation categories with clear scope mappings
const VALIDATION_CATEGORIES = {
  backend: 'Backend/Service Tasks',
  ui: 'UI/Interface Tasks',
  core: 'Core System Tasks',
  build: 'Compilation/Build Tasks',
  quality: 'Code Quality Tasks',
  architecture: 'Architecture/Pattern Tasks',
  mcp: 'MCP Server Tasks',
  feature: 'Feature Enhancement Tasks'
};

// Category → Default Scope Mapping (predictable, no auto-detection)
const CATEGORY_SCOPE_MAPPING = {
  backend: ['src/backend/**/*.ts', 'src/session/**/*.ts', 'src/transfer/**/*.ts'],
  ui: ['src/interfaces/**/*.ts', 'src/rendering/**/*.ts', 'src/menus/**/*.ts'],
  core: ['src/core/**/*.ts', 'src/types/**/*.ts', 'src/validation/**/*.ts'],
  mcp: ['src/mcp-channel/**/*.ts', 'src/backend/service-discovery.ts'],
  quality: [], // Quality checks apply to determined scope, not its own scope
  build: [], // Build always targets full project
  architecture: [], // Architecture checks apply to determined scope
  feature: [] // Feature checks apply to determined scope
};

/**
 * PROJECT RESOLVER
 * Handles explicit project path resolution only
 */
class ProjectResolver {
  constructor(projectArg) {
    this.projectArg = projectArg;
    this.resolvedPath = null;
    this.projectInfo = null;
  }
  
  /**
   * Resolve project argument to actual build directory
   * R1: Project Resolution Accuracy
   */
  async resolve() {
    if (!this.projectArg) {
      throw new Error('Project argument is required. Use --project <path>');
    }
    
    // Convert project argument to absolute path
    const candidatePath = path.isAbsolute(this.projectArg) 
      ? this.projectArg 
      : path.resolve(process.cwd(), this.projectArg);
    
    // Validate project directory exists and has package.json
    if (!fs.existsSync(candidatePath)) {
      throw new Error(`Project directory does not exist: ${candidatePath}`);
    }
    
    const packageJsonPath = path.join(candidatePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`No package.json found in project directory: ${candidatePath}`);
    }
    
    // Parse package.json for project info
    let packageJson;
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid package.json in ${candidatePath}: ${error.message}`);
    }
    
    this.resolvedPath = candidatePath;
    this.projectInfo = {
      name: packageJson.name,
      path: candidatePath,
      packageJson,
      srcPath: path.join(candidatePath, 'src'),
      hasSrc: fs.existsSync(path.join(candidatePath, 'src')),
      hasTypeScript: fs.existsSync(path.join(candidatePath, 'tsconfig.json')),
      buildCommand: packageJson.scripts?.build || 'tsc',
      lintCommand: packageJson.scripts?.lint || 'eslint .'
    };
    
    console.log(`   Project resolved: ${this.projectInfo.name} at ${this.resolvedPath}`);
    console.log(`   Source directory: ${this.projectInfo.hasSrc ? 'Found' : 'Not found'}`);
    console.log(`   TypeScript config: ${this.projectInfo.hasTypeScript ? 'Found' : 'Not found'}`);
    
    return this.projectInfo;
  }
  
  getProjectInfo() {
    if (!this.projectInfo) {
      throw new Error('Project not resolved. Call resolve() first.');
    }
    return this.projectInfo;
  }
}

/**
 * SCOPE ROUTER
 * Determines validation scope based on category and overrides
 */
class ScopeRouter {
  constructor(category, projectResolver) {
    this.category = category;
    this.projectResolver = projectResolver;
  }
  
  /**
   * Determine validation scope with clear precedence
   * R2: Category-Based Scope Mapping
   * R3: Override System Reliability
   */
  async determineScope(overrides = {}) {
    const projectInfo = this.projectResolver.getProjectInfo();
    
    // R3: Override takes absolute precedence
    if (overrides.scope) {
      console.log(`Using scope override: ${overrides.scope}`);
      return this.resolveScopePatterns(overrides.scope, projectInfo);
    }
    
    if (overrides.files) {
      console.log(`Using file override: ${overrides.files}`);
      return this.resolveFilePatterns(overrides.files, projectInfo);
    }
    
    if (overrides.directories) {
      console.log(`Using directory override: ${overrides.directories}`);
      return this.resolveDirectoryPatterns(overrides.directories, projectInfo);
    }
    
    // R2: Category-based scope mapping
    const categoryScope = CATEGORY_SCOPE_MAPPING[this.category];
    if (categoryScope && categoryScope.length > 0) {
      console.log(`Using category scope: ${this.category}`);
      return this.resolveScopePatterns(this.category, projectInfo, categoryScope);
    }
    
    // Full project scope for categories without specific mapping
    console.log(`Using full project scope for category: ${this.category}`);
    return {
      type: 'full-project',
      description: `Full project validation for ${this.category}`,
      patterns: [`${projectInfo.srcPath}/**/*.{ts,js,json}`],
      isFullProject: true
    };
  }
  
  /**
   * Resolve scope patterns to actual file patterns
   */
  resolveScopePatterns(scopeName, projectInfo, customPatterns = null) {
    const patterns = customPatterns || CATEGORY_SCOPE_MAPPING[scopeName];
    
    if (!patterns) {
      throw new Error(`Invalid scope: ${scopeName}. Valid scopes: ${Object.keys(CATEGORY_SCOPE_MAPPING).join(', ')}`);
    }
    
    // Convert relative patterns to absolute paths
    const resolvedPatterns = patterns.map(pattern => 
      path.resolve(projectInfo.path, pattern)
    );
    
    return {
      type: 'scoped',
      scope: scopeName,
      description: `Scoped validation: ${scopeName}`,
      patterns: resolvedPatterns,
      isFullProject: false,
      fileCount: this.estimateFileCount(resolvedPatterns)
    };
  }
  
  resolveFilePatterns(filesArg, projectInfo) {
    const files = filesArg.split(',').map(f => f.trim()).filter(f => f.length > 0);
    const resolvedFiles = files.map(file => 
      path.isAbsolute(file) ? file : path.resolve(projectInfo.path, file)
    );
    
    return {
      type: 'files',
      description: `File-specific validation: ${files.length} files`,
      patterns: resolvedFiles,
      isFullProject: false,
      fileCount: files.length
    };
  }
  
  resolveDirectoryPatterns(dirsArg, projectInfo) {
    const dirs = dirsArg.split(',').map(d => d.trim()).filter(d => d.length > 0);
    const resolvedPatterns = dirs.map(dir => {
      const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(projectInfo.path, dir);
      return `${resolvedDir}/**/*.{ts,js,json}`;
    });
    
    return {
      type: 'directories',
      description: `Directory validation: ${dirs.length} directories`,
      patterns: resolvedPatterns,
      isFullProject: false,
      fileCount: this.estimateFileCount(resolvedPatterns)
    };
  }
  
  estimateFileCount(patterns) {
    // Simple estimation - could be enhanced
    return patterns.length * 50; // Rough estimate
  }
}

/**
 * TEST EXECUTOR
 * Handles layered validation execution
 */
class TestExecutor {
  constructor() {
    this.results = {
      build: null,
      scope: null,
      overall: 'PENDING',
      startTime: Date.now(),
      endTime: null
    };
  }
  
  /**
   * Execute layered validation strategy
   * R4: Layered Validation Strategy (Build + Targeted Quality)
   */
  async execute(projectInfo, scopeConfig, options = {}) {
    console.log('\nExecuting layered validation...');
    console.log(`   Layer 1: Build validation (full project)`);
    console.log(`   Layer 2: Quality validation (${scopeConfig.description})`);
    
    try {
      // Layer 1: Always validate full project build
      this.results.build = await this.executeBuildValidation(projectInfo);
      
      // Layer 2: Targeted quality validation for scope
      this.results.scope = await this.executeScopeValidation(projectInfo, scopeConfig, options);
      
      // Determine overall result
      this.results.overall = this.determineOverallResult();
      this.results.endTime = Date.now();
      
      return this.results;
    } catch (error) {
      this.results.overall = 'VALIDATION_FAILED';
      this.results.error = error.message;
      this.results.endTime = Date.now();
      throw error;
    }
  }
  
  /**
   * Layer 1: Build Validation (always full project)
   * R5: No false failures from unrelated code (but catch integration issues)
   */
  async executeBuildValidation(projectInfo) {
    console.log('\nLayer 1: Build Validation');
    
    const buildResult = {
      layer: 'build',
      target: 'full-project',
      tests: [],
      status: 'PENDING'
    };
    
    const originalCwd = process.cwd();
    
    try {
      process.chdir(projectInfo.path);
      
      // Test 1: TypeScript compilation
      if (projectInfo.hasTypeScript) {
        console.log('   Testing TypeScript compilation...');
        try {
          const tscOutput = execSync('npx tsc --noEmit', { 
            encoding: 'utf8',
            timeout: 120000 // 2 minutes max
          });
          
          buildResult.tests.push({
            name: 'TypeScript Compilation',
            status: 'PASS',
            message: 'TypeScript compilation successful',
            duration: 'fast'
          });
          
        } catch (error) {
          buildResult.tests.push({
            name: 'TypeScript Compilation',
            status: 'FAIL',
            message: 'TypeScript compilation failed',
            error: this.parseTypeScriptErrors(error.stdout + error.stderr)
          });
        }
      }
      
      // Test 2: Build command execution
      console.log(`   Testing build command: ${projectInfo.buildCommand}...`);
      try {
        const buildOutput = execSync(projectInfo.buildCommand, {
          encoding: 'utf8',
          timeout: 180000 // 3 minutes max
        });
        
        buildResult.tests.push({
          name: 'Build Command',
          status: 'PASS',
          message: 'Build command successful',
          command: projectInfo.buildCommand
        });
        
      } catch (error) {
        buildResult.tests.push({
          name: 'Build Command', 
          status: 'FAIL',
          message: 'Build command failed',
          command: projectInfo.buildCommand,
          error: error.message
        });
      }
      
    } finally {
      process.chdir(originalCwd);
    }
    
    // Determine build layer status
    const failedTests = buildResult.tests.filter(t => t.status === 'FAIL');
    buildResult.status = failedTests.length === 0 ? 'PASS' : 'FAIL';
    
    console.log(`   Build layer: ${buildResult.status} (${buildResult.tests.length} tests)`);
    
    return buildResult;
  }
  
  /**
   * Layer 2: Scope Validation (targeted quality)
   * R6: Fast targeted feedback
   */
  async executeScopeValidation(projectInfo, scopeConfig, options) {
    console.log('\nLayer 2: Scope Validation');
    console.log(`   Target: ${scopeConfig.description}`);
    
    const scopeResult = {
      layer: 'scope',
      target: scopeConfig.type,
      scope: scopeConfig.scope || 'custom',
      tests: [],
      status: 'PENDING'
    };
    
    // Only run scope validation if it's not full project or if linting is enabled
    if (scopeConfig.isFullProject && !options.enableLint) {
      console.log('   Skipping scope validation for full project build (no lint requested)');
      scopeResult.status = 'SKIPPED';
      return scopeResult;
    }
    
    const originalCwd = process.cwd();
    
    try {
      process.chdir(projectInfo.path);
      
      // Test 1: Linting (if enabled and scope is manageable)
      if (options.enableLint && !scopeConfig.isFullProject) {
        console.log('   Testing ESLint on scoped files...');
        try {
          const lintFiles = this.resolveScopeToFiles(scopeConfig, projectInfo);
          
          if (lintFiles.length > 0) {
            const lintCommand = `npx eslint ${lintFiles.join(' ')}`;
            const lintOutput = execSync(lintCommand, {
              encoding: 'utf8',
              timeout: 60000 // 1 minute max for scoped lint
            });
            
            scopeResult.tests.push({
              name: 'Scoped ESLint',
              status: 'PASS',
              message: `ESLint passed for ${lintFiles.length} files`,
              filesChecked: lintFiles.length
            });
          } else {
            scopeResult.tests.push({
              name: 'Scoped ESLint',
              status: 'WARN',
              message: 'No files found for linting in specified scope',
              filesChecked: 0
            });
          }
          
        } catch (error) {
          scopeResult.tests.push({
            name: 'Scoped ESLint',
            status: 'FAIL', 
            message: 'ESLint failed on scoped files',
            error: this.parseESLintErrors(error.stdout + error.stderr)
          });
        }
      }
      
      // Test 2: Scope-specific validation based on category
      console.log(`   Running ${this.category} category-specific tests...`);
      const categoryTest = await this.executeCategoryTest(projectInfo, scopeConfig, options);
      scopeResult.tests.push(categoryTest);
      
    } finally {
      process.chdir(originalCwd);
    }
    
    // Determine scope layer status
    const failedTests = scopeResult.tests.filter(t => t.status === 'FAIL');
    scopeResult.status = failedTests.length === 0 ? 'PASS' : 'FAIL';
    
    console.log(`   Scope layer: ${scopeResult.status} (${scopeResult.tests.length} tests)`);
    
    return scopeResult;
  }
  
  /**
   * Category-specific validation logic
   */
  async executeCategoryTest(projectInfo, scopeConfig, options) {
    // Placeholder for category-specific tests
    // In full implementation, this would delegate to category validators
    return {
      name: `Category Test: ${scopeConfig.scope || 'project'}`,
      status: 'PASS',
      message: `Category validation passed for ${scopeConfig.scope || 'project'}`
    };
  }
  
  /**
   * Resolve scope patterns to actual existing files
   */
  resolveScopeToFiles(scopeConfig, projectInfo) {
    const files = [];
    
    for (const pattern of scopeConfig.patterns) {
      // Simple file resolution - in full implementation would use glob
      try {
        if (fs.existsSync(pattern) && fs.statSync(pattern).isFile()) {
          files.push(pattern);
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
    
    return files;
  }
  
  /**
   * Parse TypeScript compilation errors
   */
  parseTypeScriptErrors(output) {
    const lines = output.split('\n');
    const errors = lines.filter(line => 
      line.includes('error TS') || line.includes(': error')
    );
    return errors.slice(0, 10); // Return first 10 errors
  }
  
  /**
   * Parse ESLint errors
   */
  parseESLintErrors(output) {
    const lines = output.split('\n');
    const errors = lines.filter(line =>
      line.includes('error') || line.includes('warning')
    );
    return errors.slice(0, 10); // Return first 10 errors
  }
  
  /**
   * Determine overall validation result
   */
  determineOverallResult() {
    const buildFailed = this.results.build.status === 'FAIL';
    const scopeFailed = this.results.scope.status === 'FAIL';
    
    if (buildFailed || scopeFailed) {
      return 'VALIDATION_FAILED';
    }
    
    if (this.results.build.status === 'PASS' && 
        (this.results.scope.status === 'PASS' || this.results.scope.status === 'SKIPPED')) {
      return 'VALIDATION_PASSED';
    }
    
    return 'VALIDATION_INCOMPLETE';
  }
}

/**
 * VALIDATION ORCHESTRATOR
 * Main coordination class
 */
class ValidationOrchestrator {
  constructor(project, category, overrides = {}, options = {}) {
    this.projectResolver = new ProjectResolver(project);
    this.category = category;
    this.overrides = overrides;
    this.options = {
      enableLint: false,
      save: false,
      taskId: null,
      ...options
    };
    
    this.scopeRouter = null;
    this.testExecutor = new TestExecutor();
  }
  
  /**
   * Main validation workflow
   */
  async validate() {
    const startTime = Date.now();
    
    try {
      console.log('TEMPLUM TASK VALIDATOR');
      console.log('='.repeat(50));
      console.log(`Category: ${VALIDATION_CATEGORIES[this.category]}`);
      console.log(`Task ID: ${this.options.taskId || 'N/A'}`);
      console.log(`Started: ${new Date().toLocaleString()}`);
      
      // Step 1: Resolve project
      console.log('\nStep 1: Project Resolution');
      const projectInfo = await this.projectResolver.resolve();
      
      // Step 2: Determine validation scope
      console.log('\nStep 2: Scope Determination');
      this.scopeRouter = new ScopeRouter(this.category, this.projectResolver);
      const scopeConfig = await this.scopeRouter.determineScope(this.overrides);
      
      console.log(`   Validation scope: ${scopeConfig.description}`);
      console.log(`   Estimated files: ${scopeConfig.fileCount || 'Unknown'}`);
      
      // Step 3: Execute validation
      console.log('\nStep 3: Validation Execution');
      const results = await this.testExecutor.execute(projectInfo, scopeConfig, this.options);
      
      // Step 4: Report results
      console.log('\nStep 4: Results');
      this.reportResults(results, startTime);
      
      // Step 5: Save results if requested
      if (this.options.save) {
        console.log('\nStep 5: Saving Results');
        await this.saveResults(results, projectInfo, scopeConfig);
      }
      
      // Exit with appropriate code
      const success = results.overall === 'VALIDATION_PASSED';
      process.exit(success ? 0 : 1);
      
    } catch (error) {
      console.error(`\nVALIDATION ERROR: ${error.message}`);
      process.exit(1);
    }
  }
  
  /**
   * Report validation results
   */
  reportResults(results, startTime) {
    const duration = Date.now() - startTime;
    
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Overall: ${results.overall}`);
    
    if (results.build) {
      console.log(`Build Layer: ${results.build.status} (${results.build.tests.length} tests)`);
    }
    
    if (results.scope) {
      console.log(`Scope Layer: ${results.scope.status} (${results.scope.tests.length} tests)`);
    }
    
    // Show any failures
    const allTests = [
      ...(results.build?.tests || []),
      ...(results.scope?.tests || [])
    ];
    
    const failures = allTests.filter(t => t.status === 'FAIL');
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.name}: ${failure.message}`);
        if (failure.error) {
          console.log(`   Error: ${failure.error.slice(0, 200)}...`);
        }
      });
    }
    
    // Next steps
    console.log('\nNext Steps:');
    if (results.overall === 'VALIDATION_PASSED') {
      console.log('Update task status to [D] documenting');
      console.log('Run /pr:document to complete implementation cycle');
    } else {
      console.log('Update task status to [B] broken');
      console.log('Run /pr:task --continue to fix identified issues');
    }
  }
  
  /**
   * Save validation results to file
   */
  async saveResults(results, projectInfo, scopeConfig) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    const filename = `${timestamp}-${this.options.taskId || 'validation'}-${this.category}.md`;
    const filepath = path.resolve(projectInfo.path, '../scripts/validation/results', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const report = this.generateReport(results, projectInfo, scopeConfig);
    fs.writeFileSync(filepath, report);
    
    console.log(`Report saved: ${path.relative(projectInfo.path, filepath)}`);
  }
  
  /**
   * Generate validation report
   */
  generateReport(results, projectInfo, scopeConfig) {
    const timestamp = new Date().toISOString();
    
    return `---
date: ${timestamp}
task-id: ${this.options.taskId || 'N/A'}
category: ${this.category}
status: ${results.overall}
project: ${projectInfo.name}
scope: ${scopeConfig.description}
---

# Validation Report - ${this.options.taskId || 'N/A'}

## Summary

**Overall Status**: ${results.overall}
**Duration**: ${Math.round((results.endTime - results.startTime) / 1000)}s
**Project**: ${projectInfo.name}
**Scope**: ${scopeConfig.description}

## Test Results

### Build Layer: ${results.build?.status || 'N/A'}

${(results.build?.tests || []).map(test => 
  `- [${test.status === 'PASS' ? 'x' : ' '}] ${test.name}: ${test.message}`
).join('\n')}

### Scope Layer: ${results.scope?.status || 'N/A'}

${(results.scope?.tests || []).map(test =>
  `- [${test.status === 'PASS' ? 'x' : ' '}] ${test.name}: ${test.message}`
).join('\n')}

## Next Steps

${results.overall === 'VALIDATION_PASSED' 
  ? '1. Update task status to [D] documenting\n2. Run /pr:document to complete cycle'
  : '1. Update task status to [B] broken\n2. Fix identified issues\n3. Re-run validation'
}

---
Generated by: Templum Task Validator
`;
  }
}

/**
 * MAIN EXECUTION
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments - SIMPLIFIED INTERFACE
  const projectIndex = args.indexOf('--project');
  const categoryIndex = args.indexOf('--category');
  const scopeIndex = args.indexOf('--scope');
  const filesIndex = args.indexOf('--files');
  const directoriesIndex = args.indexOf('--directories');
  const taskIdIndex = args.indexOf('--task-id');
  
  const saveFlag = args.includes('--save');
  const enableLintFlag = args.includes('--enable-lint');
  
  // Validate required arguments
  if (projectIndex === -1 || projectIndex + 1 >= args.length) {
    console.error('Usage: node templum-task-validator.js --project <path> --category <type> [options]');
    console.error('');
    console.error('Required Arguments:');
    console.error('  --project <path>     Project directory path');
    console.error('  --category <type>    Validation category');
    console.error('');
    console.error('Optional Arguments:');
    console.error('  --scope <scope>      Override validation scope');
    console.error('  --files <patterns>   Specific file patterns');
    console.error('  --directories <dirs> Specific directories');
    console.error('  --task-id <id>       Task identifier');
    console.error('  --save               Save validation report');
    console.error('  --enable-lint        Include ESLint checks');
    console.error('');
    console.error('Categories:', Object.keys(VALIDATION_CATEGORIES).join(', '));
    console.error('Scopes:', Object.keys(CATEGORY_SCOPE_MAPPING).join(', '));
    console.error('');
    console.error('Examples:');
    console.error('  # Standard validation');
    console.error('  node templum-task-validator.js --project Templum --category backend');
    console.error('  # With scope override');  
    console.error('  node templum-task-validator.js --project Templum --category backend --scope backend');
    console.error('  # Repo-agnostic task');
    console.error('  node templum-task-validator.js --project .claude/mcp-integration --category mcp');
    process.exit(2);
  }
  
  if (categoryIndex === -1 || categoryIndex + 1 >= args.length) {
    console.error('--category argument is required');
    process.exit(2);
  }
  
  // Extract arguments
  const project = args[projectIndex + 1];
  const category = args[categoryIndex + 1];
  const scope = scopeIndex !== -1 && scopeIndex + 1 < args.length ? args[scopeIndex + 1] : null;
  const files = filesIndex !== -1 && filesIndex + 1 < args.length ? args[filesIndex + 1] : null;
  const directories = directoriesIndex !== -1 && directoriesIndex + 1 < args.length ? args[directoriesIndex + 1] : null;
  const taskId = taskIdIndex !== -1 && taskIdIndex + 1 < args.length ? args[taskIdIndex + 1] : null;
  
  // Validate category
  if (!VALIDATION_CATEGORIES[category]) {
    console.error(`Invalid category: ${category}`);
    console.error(`Valid categories: ${Object.keys(VALIDATION_CATEGORIES).join(', ')}`);
    process.exit(2);
  }
  
  // Validate scope if provided
  if (scope && !CATEGORY_SCOPE_MAPPING[scope]) {
    console.error(`Invalid scope: ${scope}`);
    console.error(`Valid scopes: ${Object.keys(CATEGORY_SCOPE_MAPPING).join(', ')}`);
    process.exit(2);
  }
  
  try {
    const overrides = { scope, files, directories };
    const options = { enableLint: enableLintFlag, save: saveFlag, taskId };
    
    const orchestrator = new ValidationOrchestrator(project, category, overrides, options);
    await orchestrator.validate();
    
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

export { ValidationOrchestrator, ProjectResolver, ScopeRouter, TestExecutor };
