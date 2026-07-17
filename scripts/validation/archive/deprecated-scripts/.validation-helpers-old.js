#!/usr/bin/env node

/**
 * Shared Validation Helpers
 * 
 * Purpose: Common functionality for all validation scripts
 * Usage: import { ProjectDetector, ComponentValidator, etc. } from './validation-helpers.js'
 * 
 * Provides:
 * - Project structure detection and source directory discovery
 * - Component file searching with recursive search capability
 * - TypeScript compilation validation and error analysis
 * - Test execution and result parsing
 * - Evidence collection and tracker-compatible output formatting
 * - Timestamp generation and file system utilities
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Component status indicators - standardized across all validation scripts
export const STATUS = {
  WORKING: '🟢 Working',
  BROKEN: '🔴 Broken', 
  MISSING: '❌ Missing',
  PARTIAL: '🟡 Partial',
  UNKNOWN: '⚠️ Unknown'
};

// Priority levels - standardized across all validation scripts
export const PRIORITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

/**
 * Project Structure Detection and Management
 */
export class ProjectDetector {
  constructor() {
    this.structure = this.detectProjectStructure();
  }

  /**
   * Auto-detect project root and structure
   */
  detectProjectStructure() {
    const currentDir = process.cwd();
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    
    // Look for project indicators going up the directory tree
    const projectIndicators = ['package.json', 'tsconfig.json', '.git', 'node_modules'];
    const commonProjectRoots = [
      currentDir,
      path.resolve(currentDir, '../'),
      path.resolve(currentDir, '../../'),
      path.resolve(scriptDir, '../../'),
      path.resolve(scriptDir, '../../../')
    ];

    let detectedRoot = null;
    
    // Find the most likely project root
    for (const rootCandidate of commonProjectRoots) {
      const hasIndicators = projectIndicators.some(indicator => 
        fs.existsSync(path.join(rootCandidate, indicator))
      );
      if (hasIndicators) {
        detectedRoot = rootCandidate;
        break;
      }
    }
    
    // Fallback to current directory if no indicators found
    const PROJECT_ROOT = detectedRoot || currentDir;
    
    // Look for src directories recursively
    const possibleSrcDirs = [
      path.join(PROJECT_ROOT, 'src'),
      path.join(PROJECT_ROOT, 'Haruspex/src'),
      path.join(PROJECT_ROOT, 'phoenix-code-lite/src'),
      path.join(PROJECT_ROOT, 'Templum/src'),
      // Add other common project structures
      ...this.findSubdirectoriesWithSrc(PROJECT_ROOT)
    ].filter(dir => fs.existsSync(dir));
    
    const VALIDATION_RESULTS_DIR = path.join(PROJECT_ROOT, 'scripts/validation/results');
    
    return {
      PROJECT_ROOT,
      SRC_DIRS: [...new Set(possibleSrcDirs)], // Remove duplicates
      VALIDATION_RESULTS_DIR
    };
  }

  /**
   * Recursively find directories containing 'src' subdirectories
   */
  findSubdirectoriesWithSrc(rootDir, maxDepth = 3, currentDepth = 0) {
    const srcDirs = [];
    
    if (currentDepth >= maxDepth) return srcDirs;
    
    try {
      const entries = fs.readdirSync(rootDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            !entry.name.includes('node_modules') && !entry.name.includes('coverage') &&
            !entry.name.includes('dist')) {
          const subDir = path.join(rootDir, entry.name);
          const srcPath = path.join(subDir, 'src');
          
          if (fs.existsSync(srcPath)) {
            srcDirs.push(srcPath);
          }
          
          // Recursively search subdirectories
          if (currentDepth < 2) { // Limit recursion for performance
            srcDirs.push(...this.findSubdirectoriesWithSrc(subDir, maxDepth, currentDepth + 1));
          }
        }
      }
    } catch (error) {
      // Ignore permission errors or other issues
    }
    
    return srcDirs;
  }

  /**
   * Get project root directory
   */
  getProjectRoot() {
    return this.structure.PROJECT_ROOT;
  }

  /**
   * Get all source directories
   */
  getSourceDirectories() {
    return this.structure.SRC_DIRS;
  }

  /**
   * Get validation results directory
   */
  getValidationResultsDir() {
    return this.structure.VALIDATION_RESULTS_DIR;
  }

  /**
   * Display project structure information
   */
  logProjectInfo() {
    console.log('🚀 Project detection results:');
    console.log('Project root:', this.structure.PROJECT_ROOT);
    console.log('Source directories found:', this.structure.SRC_DIRS.length);
    this.structure.SRC_DIRS.forEach((dir, index) => 
      console.log(`  ${index + 1}. ${path.relative(this.structure.PROJECT_ROOT, dir)}`));
  }

  /**
   * Determine the correct build directory based on explicit project parameter
   * @param {string} project - Explicit project name (templum, phoenix-code-lite, haruspex) or null for default
   * @returns {string} - Path to the appropriate build directory
   */
  getBuildDirectory(project = null) {
    const projectRoot = this.structure.PROJECT_ROOT;
    
    // If explicit project specified, use it
    if (project) {
      // First try project directory relative to project root
      let projectDir = path.join(projectRoot, project);
      if (fs.existsSync(path.join(projectDir, 'package.json'))) {
        console.log(`    Using ${project} project directory (explicit)`);
        return projectDir;
      }
      
      // If that fails, try matching current directory name (case insensitive)
      const currentDirName = path.basename(projectRoot);
      if (currentDirName.toLowerCase() === project.toLowerCase()) {
        if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
          console.log(`    Using current directory as ${project} project (explicit)`);
          return projectRoot;
        }
      }
      
      // Try parent directory for project subdirectories
      const parentDir = path.dirname(projectRoot);
      projectDir = path.join(parentDir, project);
      if (fs.existsSync(path.join(projectDir, 'package.json'))) {
        console.log(`    Using ${project} project directory from parent (explicit)`);
        return projectDir;
      }
      
      console.log(`    Warning: Specified project '${project}' not found, using fallback`);
    }
    
    // Check if current directory is a valid project
    if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
      console.log(`    Using current directory as project`);
      return projectRoot;
    }
    
    // Default priority: Templum > phoenix-code-lite > Haruspex
    const possibleProjects = ['Templum', 'phoenix-code-lite', 'Haruspex'];
    
    // Try projects as subdirectories of current directory
    for (const projectName of possibleProjects) {
      const projectDir = path.join(projectRoot, projectName);
      if (fs.existsSync(path.join(projectDir, 'package.json'))) {
        console.log(`    Using ${projectName} project directory (default priority)`);
        return projectDir;
      }
    }
    
    // Try projects as subdirectories of parent directory
    const parentDir = path.dirname(projectRoot);
    for (const projectName of possibleProjects) {
      const projectDir = path.join(parentDir, projectName);
      if (fs.existsSync(path.join(projectDir, 'package.json'))) {
        console.log(`    Using ${projectName} project directory from parent (default priority)`);
        return projectDir;
      }
    }
    
    // Only use project root as absolute fallback if no projects found
    console.log(`    Using project root directory as fallback (no projects found)`);
    return projectRoot;
  }
}

/**
 * Component Search and Discovery
 */
export class ComponentSearcher {
  constructor(projectDetector) {
    this.detector = projectDetector;
  }

  /**
   * Find component files using comprehensive recursive search strategy
   */
  findComponentFiles(componentName) {
    // Primary method: Comprehensive recursive search (folder-agnostic)
    const foundFiles = this.comprehensiveRecursiveSearch(componentName);
    
    // Fallback: Use old method if recursive search finds nothing
    if (foundFiles.length === 0) {
      console.log(`  🔍 Recursive search found no files, trying legacy search...`);
      const legacyPaths = this.getPossibleComponentPaths(componentName);
      for (const filePath of legacyPaths) {
        if (fs.existsSync(filePath)) {
          foundFiles.push(filePath);
        }
      }
    }

    return [...new Set(foundFiles)]; // Remove duplicates
  }

  /**
   * Comprehensive recursive search - folder-agnostic file finding
   * Searches ALL subdirectories for files matching the component name
   */
  comprehensiveRecursiveSearch(componentName) {
    console.log(`  🔍 Performing comprehensive recursive search for "${componentName}"...`);
    const foundFiles = [];
    
    // Generate all possible filename variations
    const searchVariations = this.generateFilenameVariations(componentName);
    console.log(`  📝 Searching for ${searchVariations.length} filename variations`);
    
    // Search in all source directories
    this.detector.getSourceDirectories().forEach(srcDir => {
      console.log(`  🔎 Searching in: ${path.relative(this.detector.getProjectRoot(), srcDir)}`);
      foundFiles.push(...this.recursiveFileSearch(srcDir, searchVariations));
    });

    if (foundFiles.length > 0) {
      console.log(`  ✅ Found ${foundFiles.length} matching file(s)`);
      foundFiles.forEach(file => {
        console.log(`    - ${path.relative(this.detector.getProjectRoot(), file)}`);
      });
    } else {
      console.log(`  ❌ No files found matching "${componentName}"`);
    }

    return foundFiles;
  }

  /**
   * Generate all possible filename variations for a component
   */
  generateFilenameVariations(componentName) {
    const variations = new Set();
    const extensions = ['.ts', '.js', '.tsx', '.jsx']; // Support multiple file types
    
    // Basic variations
    const baseName = componentName.replace(/^.*?-/, ''); // Remove prefixes
    const camelCase = baseName.charAt(0).toLowerCase() + baseName.slice(1);
    const pascalCase = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    const kebabCase = componentName.toLowerCase().replace(/[^a-z0-9]/gi, '-');
    const snakeCase = componentName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    
    // Add all combinations
    const nameVariations = [
      componentName,           // exact match
      baseName,               // without prefix
      camelCase,              // camelCase
      pascalCase,             // PascalCase  
      kebabCase,              // kebab-case
      snakeCase,              // snake_case
      componentName.replace(/-/g, ''), // remove dashes
      componentName.replace(/_/g, ''), // remove underscores
    ];
    
    // Apply all extensions to all name variations
    nameVariations.forEach(name => {
      extensions.forEach(ext => {
        variations.add(name + ext);
      });
    });
    
    return Array.from(variations);
  }

  /**
   * Recursively search directory for matching filenames
   * NO DEPTH LIMIT - searches entire directory tree
   */
  recursiveFileSearch(dir, targetFilenames, foundFiles = []) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile()) {
          // Check if this file matches any of our target filenames
          if (targetFilenames.includes(entry.name)) {
            foundFiles.push(fullPath);
          }
        } else if (entry.isDirectory() && this.shouldSearchDirectory(entry.name)) {
          // Recursively search subdirectories (NO DEPTH LIMIT!)
          this.recursiveFileSearch(fullPath, targetFilenames, foundFiles);
        }
      }
    } catch (error) {
      // Ignore permission errors or other filesystem issues
      console.log(`    ⚠️ Skipping directory ${dir}: ${error.message}`);
    }
    
    return foundFiles;
  }

  /**
   * Determine if we should search in this directory
   */
  shouldSearchDirectory(dirName) {
    const skipDirectories = [
      'node_modules',
      '.git', 
      '.vscode',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      '.tmp',
      'tmp'
    ];
    
    return !dirName.startsWith('.') && !skipDirectories.includes(dirName.toLowerCase());
  }

  /**
   * Get possible file paths for the component using recursive search
   */
  getPossibleComponentPaths(componentName) {
    const baseName = componentName.replace(/^.*?-/, '');
    const possiblePaths = [];

    // Check common component locations
    const locations = [
      'core', 'components', 'providers', 'api', 'integration', 'compatibility',
      'debugging', 'setup', 'monitoring', 'skin', 'engine', 'cache', 'diagnostics',
      'cli', 'tdd', 'preparation', 'config'
    ];

    // Search in all discovered source directories
    this.detector.getSourceDirectories().forEach(srcDir => {
      // Check subdirectories within each src directory
      locations.forEach(location => {
        // Check for exact match
        possiblePaths.push(path.join(srcDir, location, `${componentName}.ts`));
        // Check for kebab-case
        possiblePaths.push(path.join(srcDir, location, `${baseName}.ts`));
        // Check for camelCase
        possiblePaths.push(path.join(srcDir, location, `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}.ts`));
      });

      // Check root of each src directory
      possiblePaths.push(path.join(srcDir, `${componentName}.ts`));
      possiblePaths.push(path.join(srcDir, `${baseName}.ts`));
    });

    // Also perform a recursive search
    possiblePaths.push(...this.recursiveComponentSearch(componentName));

    return [...new Set(possiblePaths)];
  }

  /**
   * Recursively search for component files across all source directories
   */
  recursiveComponentSearch(componentName) {
    const foundPaths = [];
    const searchNames = [
      `${componentName}.ts`,
      `${componentName.replace(/^.*?-/, '')}.ts`,
      `${componentName.replace(/-/g, '')}.ts`
    ];

    const searchInDirectory = (dir, maxDepth = 3, currentDepth = 0) => {
      if (currentDepth >= maxDepth) return;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.ts')) {
            if (searchNames.includes(entry.name)) {
              foundPaths.push(path.join(dir, entry.name));
            }
          } else if (entry.isDirectory() && !entry.name.startsWith('.') && 
                     !entry.name.includes('node_modules') && !entry.name.includes('__tests__')) {
            searchInDirectory(path.join(dir, entry.name), maxDepth, currentDepth + 1);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    // Search in all source directories
    this.detector.getSourceDirectories().forEach(srcDir => {
      searchInDirectory(srcDir);
    });

    return foundPaths;
  }

  /**
   * Find the best project directory for a component (for compilation)
   */
  getComponentProjectDirectory(componentFiles) {
    if (componentFiles.length === 0) return this.detector.getProjectRoot();
    
    // Use the directory containing the first component file
    const firstComponentFile = componentFiles[0];
    
    // Walk up the directory tree to find package.json or tsconfig.json
    let currentDir = path.dirname(firstComponentFile);
    const maxLevelsUp = 5;
    
    for (let i = 0; i < maxLevelsUp; i++) {
      const packageJson = path.join(currentDir, 'package.json');
      const tsConfig = path.join(currentDir, 'tsconfig.json');
      
      if (fs.existsSync(packageJson) || fs.existsSync(tsConfig)) {
        return currentDir;
      }
      
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // Reached root
      currentDir = parentDir;
    }
    
    return this.detector.getProjectRoot();
  }
}

/**
 * TypeScript Compilation Validator
 */
export class CompilationValidator {
  constructor(projectDetector) {
    this.detector = projectDetector;
  }

  /**
   * Validate TypeScript compilation for component files
   */
  async validateCompilation(componentFiles, componentProject) {
    const results = {
      status: null,
      errors: [],
      warnings: [],
      evidence: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(componentProject);

      // Check if TypeScript is available
      try {
        const tscVersion = execSync('npx tsc --version', { encoding: 'utf8' });
        console.log(`  📋 TypeScript version: ${tscVersion.trim()}`);
      } catch (error) {
        console.log('  ⚠️ TypeScript not available, skipping compilation check');
        results.status = 'TypeScript not available';
        return results;
      }

      // Try to compile just the component files
      const relativeFiles = componentFiles.map(f => path.relative(componentProject, f));
      
      try {
        const compileResult = execSync(`npx tsc --noEmit ${relativeFiles.join(' ')}`, { 
          encoding: 'utf8',
          stderr: 'pipe'
        });
        
        if (compileResult.trim() === '') {
          console.log('  ✅ Component compiles without errors');
          results.status = 'Clean compilation';
        } else {
          console.log('  ⚠️ Component compiles with warnings');
          results.status = 'Compiles with warnings';
          results.warnings.push(compileResult.trim());
        }
      } catch (compileError) {
        const errorOutput = compileError.stderr || compileError.message;
        const errorLines = errorOutput.split('\n').filter(line => line.trim());
        
        console.log(`  ❌ Component has ${errorLines.length} compilation error(s)`);
        results.status = `Compilation failed: ${errorLines.length} errors`;
        results.errors.push(...errorLines);
        
        // Analyze error types
        const errorAnalysis = this.analyzeCompilationErrors(errorLines);
        results.evidence.push(`Compilation failed with ${errorLines.length} errors: ${errorAnalysis}`);
      }

      process.chdir(originalCwd);
    } catch (error) {
      console.log(`  ⚠️ Compilation check failed: ${error.message}`);
      results.status = `Check failed: ${error.message}`;
    }

    return results;
  }

  /**
   * Analyze compilation errors for patterns
   */
  analyzeCompilationErrors(errorLines) {
    const errorTypes = {
      typeErrors: 0,
      importErrors: 0,
      syntaxErrors: 0,
      otherErrors: 0
    };

    errorLines.forEach(line => {
      if (line.includes('TS') && line.includes('error')) {
        if (line.includes('Cannot find module') || line.includes('Module not found')) {
          errorTypes.importErrors++;
        } else if (line.includes('Type') && line.includes('is not assignable')) {
          errorTypes.typeErrors++;
        } else if (line.includes('Unexpected token') || line.includes('syntax')) {
          errorTypes.syntaxErrors++;
        } else {
          errorTypes.otherErrors++;
        }
      }
    });

    const analysis = [];
    if (errorTypes.importErrors > 0) analysis.push(`${errorTypes.importErrors} import errors`);
    if (errorTypes.typeErrors > 0) analysis.push(`${errorTypes.typeErrors} type errors`);
    if (errorTypes.syntaxErrors > 0) analysis.push(`${errorTypes.syntaxErrors} syntax errors`);
    if (errorTypes.otherErrors > 0) analysis.push(`${errorTypes.otherErrors} other errors`);

    return analysis.join(', ');
  }
}

/**
 * Test Execution Validator
 */
export class TestValidator {
  constructor(projectDetector) {
    this.detector = projectDetector;
  }

  /**
   * Validate component tests
   */
  async validateTests(componentName, componentFiles, componentProject) {
    const results = {
      status: null,
      testFiles: [],
      errors: [],
      warnings: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(componentProject);

      // Look for test files
      const testFiles = componentFiles.map(f => {
        const dir = path.dirname(f);
        const baseName = path.basename(f, '.ts');
        return path.join(dir, '__tests__', `${baseName}.test.ts`);
      }).filter(f => fs.existsSync(f));

      results.testFiles = testFiles;

      if (testFiles.length === 0) {
        console.log('  ⚠️ No test files found for component');
        results.status = 'No tests found';
        results.warnings.push('Component lacks test coverage');
      } else {
        console.log(`  📋 Found ${testFiles.length} test file(s)`);
        testFiles.forEach(f => console.log(`    - ${path.relative(componentProject, f)}`));
        
        // Try to run tests
        try {
          const testResult = execSync(`npm test -- --testPathPattern="${componentName}" --passWithNoTests`, {
            encoding: 'utf8',
            timeout: 30000
          });
          
          if (testResult.includes('PASS') || testResult.includes('pass')) {
            console.log('  ✅ Tests pass');
            results.status = 'Tests pass';
          } else {
            console.log('  ⚠️ Test results unclear');
            results.status = 'Test results unclear';
          }
        } catch (testError) {
          console.log(`  ❌ Tests failed: ${testError.message}`);
          results.status = `Tests failed: ${testError.message}`;
          results.errors.push(`Test execution failed: ${testError.message}`);
        }
      }

      process.chdir(originalCwd);
    } catch (error) {
      console.log(`  ⚠️ Test validation failed: ${error.message}`);
      results.status = `Validation failed: ${error.message}`;
    }

    return results;
  }
}

/**
 * Dependency Analyzer
 */
export class DependencyAnalyzer {
  /**
   * Analyze component dependencies
   */
  analyzeDependencies(componentFiles) {
    const dependencies = [];
    
    for (const filePath of componentFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
        
        if (importMatches) {
          importMatches.forEach(match => {
            const modulePath = match.match(/from\s+['"]([^'"]+)['"]/)[1];
            if (!modulePath.startsWith('.') && !modulePath.startsWith('@')) {
              dependencies.push(modulePath);
            }
          });
        }
      } catch (error) {
        console.log(`  ⚠️ Could not read file ${filePath}: ${error.message}`);
      }
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }
}

/**
 * Status Assessment Calculator
 */
export class StatusCalculator {
  /**
   * Calculate overall component status using README scoring system
   */
  calculateStatus(assessmentData) {
    let score = 0;
    const evidence = [];

    // File existence (25 points) - README specification
    if (assessmentData.filesFound > 0) {
      score += 25;
      evidence.push('Component files exist');
    }

    // Compilation status (35 points) - README specification
    if (assessmentData.compilationStatus === 'Clean compilation') {
      score += 35;
      evidence.push('Compiles without errors');
    } else if (assessmentData.compilationStatus === 'Compiles with warnings') {
      score += 25;
      evidence.push('Compiles with warnings');
    } else if (assessmentData.compilationStatus && assessmentData.compilationStatus.includes('failed')) {
      score += 0;
      evidence.push('Compilation failed');
    }

    // Test status (25 points) - README specification
    if (assessmentData.testStatus === 'Tests pass') {
      score += 25;
      evidence.push('Tests pass');
    } else if (assessmentData.testStatus === 'No tests found') {
      score += 10;
      evidence.push('No test coverage');
    } else if (assessmentData.testStatus && assessmentData.testStatus.includes('failed')) {
      score += 0;
      evidence.push('Tests fail');
    }

    // Dependencies (15 points) - README specification
    if (assessmentData.dependencies.length === 0) {
      score += 15;
      evidence.push('No external dependencies');
    } else if (assessmentData.dependencies.length <= 3) {
      score += 10;
      evidence.push('Minimal dependencies');
    } else {
      score += 5;
      evidence.push('Multiple dependencies');
    }

    // Determine status and priority based on README scoring system
    let status, priority;
    if (score >= 80) {
      status = STATUS.WORKING;
      priority = PRIORITY.LOW;
    } else if (score >= 60) {
      status = STATUS.PARTIAL;
      priority = PRIORITY.MEDIUM;
    } else if (score >= 40) {
      status = STATUS.BROKEN;
      priority = PRIORITY.HIGH;
    } else {
      status = STATUS.BROKEN;
      priority = PRIORITY.CRITICAL;
    }

    return {
      score,
      status,
      priority,
      evidence
    };
  }
}

/**
 * Evidence Generator
 */
export class EvidenceGenerator {
  constructor(projectDetector) {
    this.detector = projectDetector;
  }

  /**
   * Save validation results to file
   */
  async saveValidationResults(componentName, results) {
    try {
      const resultsDir = this.detector.getValidationResultsDir();
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${componentName}-validation.json`;
      const filepath = path.join(resultsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved to: ${path.relative(this.detector.getProjectRoot(), filepath)}`);
      
      return filepath;
    } catch (error) {
      console.error(`❌ Failed to save results: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate timestamp in the format expected by fix documentation
   */
  generateTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Generate PowerShell-compatible timestamp for Windows
   */
  generateWindowsTimestamp() {
    try {
      return execSync('powershell "Get-Date -Format \'yyyy-MM-dd-HHmm\'"', { encoding: 'utf8' }).trim();
    } catch (error) {
      // Fallback to JavaScript date formatting
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    }
  }
}

/**
 * Recommendation Generator
 */
export class RecommendationGenerator {
  /**
   * Generate context-aware recommendations
   */
  generateRecommendations(assessmentData) {
    const recommendations = [];

    if (assessmentData.status === STATUS.MISSING) {
      recommendations.push('Component needs to be implemented from scratch');
      recommendations.push('Check Implementation Tracker for design requirements');
    }

    if (assessmentData.compilationStatus && assessmentData.compilationStatus.includes('failed')) {
      recommendations.push('Fix TypeScript compilation errors before proceeding');
      recommendations.push('Check import paths and type definitions');
    }

    if (assessmentData.testStatus === 'No tests found') {
      recommendations.push('Add test coverage for component functionality');
      recommendations.push('Create unit tests for public methods');
    }

    if (assessmentData.dependencies.length > 5) {
      recommendations.push('Consider reducing external dependencies');
      recommendations.push('Review if all dependencies are necessary');
    }

    if (assessmentData.status === STATUS.BROKEN && assessmentData.priority === PRIORITY.CRITICAL) {
      recommendations.push('Component requires immediate attention');
      recommendations.push('Consider architectural review if issues persist');
    }

    if (recommendations.length === 0) {
      recommendations.push('Component is in good health - no immediate action needed');
    }

    return recommendations;
  }
}

/**
 * Utility Functions
 */
export class ValidationUtils {
  /**
   * Display formatted validation results
   */
  static displayResults(componentName, results, projectRoot) {
    console.log('\n' + '='.repeat(50));
    console.log(`📋 VALIDATION RESULTS: ${componentName.toUpperCase()}`);
    console.log('='.repeat(50));
    
    console.log(`\n🏷️  Status: ${results.status}`);
    console.log(`⚠️  Priority: ${results.priority}`);
    console.log(`📅 Timestamp: ${results.timestamp}`);
    
    console.log(`\n📁 Files Found: ${results.files.length}`);
    results.files.forEach(file => {
      console.log(`  - ${path.relative(projectRoot, file)}`);
    });
    
    console.log(`\n🔧 Compilation: ${results.compilationStatus || 'Not checked'}`);
    console.log(`🧪 Tests: ${results.testStatus || 'Not checked'}`);
    console.log(`📦 Dependencies: ${results.dependencies.length}`);
    
    if (results.errors.length > 0) {
      console.log(`\n❌ Errors (${results.errors.length}):`);
      results.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error.substring(0, 80)}${error.length > 80 ? '...' : ''}`);
      });
      if (results.errors.length > 5) {
        console.log(`  ... and ${results.errors.length - 5} more errors`);
      }
    }
    
    if (results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${results.warnings.length}):`);
      results.warnings.slice(0, 3).forEach(warning => {
        console.log(`  - ${warning.substring(0, 80)}${warning.length > 80 ? '...' : ''}`);
      });
    }
    
    console.log(`\n💡 Recommendations:`);
    results.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * Validate command line arguments
   */
  static validateArgs(args, requiredCount, usageMessage) {
    if (args.length < requiredCount) {
      console.error(`❌ ${usageMessage}`);
      process.exit(1);
    }
  }
}
