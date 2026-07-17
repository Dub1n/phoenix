#!/usr/bin/env node

/**
 * Flexible Validation Framework
 * 
 * Purpose: Address rigidity issues in existing validation scripts
 * Key Features:
 * - Dynamic path resolution with multiple fallback strategies
 * - Configurable file requirements instead of hardcoded lists
 * - Tiered validation (core/standard/extended) instead of all-or-nothing
 * - Adaptive directory detection with graceful fallbacks
 * - Project-agnostic validation suitable for different repository structures
 * 
 * Usage: node flexible-validator.js --category subagent --task-id TASK-SUBAGENT-002 [options]
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class FlexibleValidator {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      category: options.category || 'subagent',
      taskId: options.taskId || 'unknown',
      verbose: options.verbose || false,
      ...options
    };
    
    this.results = {
      status: 'pending',
      tests: [],
      evidence: [],
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  /**
   * Multi-strategy path resolution
   * Tries different strategies to find the target directory
   */
  async findTargetDirectory(targetName, searchPaths = []) {
    const strategies = [
      // Strategy 1: Direct from project root
      { name: 'project-root', basePath: this.options.projectRoot },
      // Strategy 2: Parent directory of project root
      { name: 'parent-dir', basePath: path.resolve(this.options.projectRoot, '..') },
      // Strategy 3: Current working directory
      { name: 'cwd', basePath: process.cwd() },
      // Strategy 4: User-provided search paths
      ...searchPaths.map((p, i) => ({ name: `custom-${i}`, basePath: p }))
    ];

    for (const strategy of strategies) {
      try {
        const candidatePath = path.resolve(strategy.basePath, targetName);
        await fs.access(candidatePath);
        
        if (this.options.verbose) {
          console.log(`    ✅ Found ${targetName} using ${strategy.name} strategy: ${candidatePath}`);
        }
        
        this.results.evidence.push(`Directory found: ${targetName} (${strategy.name} strategy)`);
        return {
          path: candidatePath,
          strategy: strategy.name,
          basePath: strategy.basePath
        };
      } catch (error) {
        if (this.options.verbose) {
          console.log(`    🔍 Strategy ${strategy.name} failed: ${candidatePath} not accessible`);
        }
      }
    }
    
    throw new Error(`Target directory '${targetName}' not found with any strategy`);
  }

  /**
   * Flexible file validation with tiered requirements
   */
  async validateFiles(baseDir, fileConfig) {
    const tiers = ['core', 'standard', 'extended'];
    const results = { core: 0, standard: 0, extended: 0 };
    
    for (const tier of tiers) {
      const files = fileConfig[tier] || [];
      
      for (const file of files) {
        try {
          const filePath = path.resolve(baseDir, file);
          await fs.access(filePath);
          
          results[tier]++;
          this.results.evidence.push(`✅ ${tier} file exists: ${file}`);
          
          if (this.options.verbose) {
            console.log(`      ✅ ${tier} file: ${file}`);
          }
        } catch (error) {
          const message = `${tier} file missing: ${file}`;
          
          if (tier === 'core') {
            this.results.errors.push(message);
          } else {
            this.results.warnings.push(message);
          }
          
          if (this.options.verbose) {
            console.log(`      ${tier === 'core' ? '❌' : '🟡'} ${message}`);
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Flexible directory validation
   */
  async validateDirectories(baseDir, directories, minRequired = 1) {
    let found = 0;
    
    for (const dir of directories) {
      try {
        const dirPath = path.resolve(baseDir, dir);
        await fs.access(dirPath);
        
        found++;
        this.results.evidence.push(`✅ Directory exists: ${dir}`);
        
        if (this.options.verbose) {
          console.log(`      ✅ Directory: ${dir}`);
        }
      } catch (error) {
        this.results.warnings.push(`Directory missing: ${dir}`);
        
        if (this.options.verbose) {
          console.log(`      🟡 Directory missing: ${dir}`);
        }
      }
    }
    
    const passed = found >= minRequired;
    const message = `Directory validation: ${found}/${directories.length} found (minimum: ${minRequired})`;
    
    if (passed) {
      this.results.evidence.push(`✅ ${message}`);
    } else {
      this.results.errors.push(`❌ ${message}`);
    }
    
    return { found, total: directories.length, passed };
  }

  /**
   * Configurable TypeScript compilation test
   */
  async validateTypeScriptCompilation(projectPath) {
    console.log('    Validating TypeScript compilation...');
    
    try {
      const originalCwd = process.cwd();
      process.chdir(projectPath);
      
      try {
        // Check for tsconfig.json
        await fs.access(path.resolve(projectPath, 'tsconfig.json'));
        
        // Run TypeScript compilation
        const output = execSync('npx tsc --noEmit', { 
          encoding: 'utf8',
          timeout: 30000
        });
        
        this.results.evidence.push('✅ TypeScript compilation successful');
        this.results.tests.push({
          name: 'TypeScript Compilation',
          status: 'PASS',
          evidence: 'Clean compilation with no errors'
        });
        
        if (this.options.verbose) {
          console.log('      ✅ TypeScript compilation passed');
        }
        
      } finally {
        process.chdir(originalCwd);
      }
      
    } catch (error) {
      this.results.errors.push(`TypeScript compilation failed: ${error.message}`);
      this.results.tests.push({
        name: 'TypeScript Compilation',
        status: 'FAIL',
        error: error.message
      });
      
      if (this.options.verbose) {
        console.log('      ❌ TypeScript compilation failed');
      }
    }
  }

  /**
   * Subagent-specific validation logic
   */
  async validateSubagentWorkflow() {
    console.log('  Validating Subagent Workflow implementation...');
    
    try {
      // Find .claude directory using flexible path resolution
      const claudeInfo = await this.findTargetDirectory('.claude');
      const claudeDir = claudeInfo.path;
      
      // Define flexible configuration for subagent validation
      const config = {
        directories: [
          'handoff',
          'handoff/input',
          'handoff/output',
          'handoff/archive',
          'agents',
          'agents/interfaces',
          'agents/utils'
        ],
        files: {
          core: [
            'agents/interfaces/handoff-types.ts',
            'agents/utils/file-naming.ts'
          ],
          standard: [
            'agents/utils/validation.ts',
            'agents/utils/error-handling.ts',
            'agents/utils/file-manager.ts',
            'agents/utils/research-capabilities.ts'
          ],
          extended: [
            'agents/utils/cleanup.ts',
            'agents/utils/audit-logger.ts',
            'agents/utils/test-utilities.ts',
            'agents/utils/research-agent-implementation.ts'
          ]
        },
        thresholds: {
          minDirectories: 4,
          minCoreFiles: 1,
          minStandardFiles: 2
        }
      };
      
      // Validate directories
      const dirResult = await this.validateDirectories(claudeDir, config.directories, config.thresholds.minDirectories);
      
      // Validate files
      const fileResult = await this.validateFiles(claudeDir, config.files);
      
      // Evaluate overall results
      const coreOk = fileResult.core >= config.thresholds.minCoreFiles;
      const standardOk = fileResult.standard >= config.thresholds.minStandardFiles;
      const dirOk = dirResult.passed;
      
      if (coreOk && standardOk && dirOk) {
        console.log('      ✅ Subagent workflow validation passed');
        this.results.tests.push({
          name: 'Subagent Workflow Structure',
          status: 'PASS',
          details: {
            directories: `${dirResult.found}/${dirResult.total}`,
            coreFiles: fileResult.core,
            standardFiles: fileResult.standard,
            extendedFiles: fileResult.extended
          }
        });
      } else {
        throw new Error(`Insufficient implementation: Core(${fileResult.core}), Standard(${fileResult.standard}), Dirs(${dirResult.found})`);
      }
      
      // TypeScript compilation test
      const agentsDir = path.resolve(claudeDir, 'agents');
      await this.validateTypeScriptCompilation(agentsDir);
      
    } catch (error) {
      this.results.errors.push(`Subagent workflow validation failed: ${error.message}`);
      this.results.tests.push({
        name: 'Subagent Workflow Structure',
        status: 'FAIL',
        error: error.message
      });
      
      console.log('      ❌ Subagent workflow validation failed');
    }
  }

  /**
   * Main validation entry point
   */
  async validate() {
    console.log(`\n🚀 Flexible Validator - ${this.options.category.toUpperCase()} (${this.options.taskId})`);
    console.log('========================================');
    
    try {
      // Route to appropriate validation logic
      switch (this.options.category) {
        case 'subagent':
          await this.validateSubagentWorkflow();
          break;
        default:
          throw new Error(`Unsupported validation category: ${this.options.category}`);
      }
      
      // Determine overall status
      this.results.status = this.results.errors.length === 0 ? 'VALIDATION_PASSED' : 'VALIDATION_FAILED';
      
      // Generate summary
      this.results.summary = {
        status: this.results.status,
        testsRun: this.results.tests.length,
        testsPassed: this.results.tests.filter(t => t.status === 'PASS').length,
        testsFailed: this.results.tests.filter(t => t.status === 'FAIL').length,
        evidenceItems: this.results.evidence.length,
        errors: this.results.errors.length,
        warnings: this.results.warnings.length
      };
      
      console.log('\n📊 Validation Summary:');
      console.log(`Status: ${this.results.status}`);
      console.log(`Tests: ${this.results.summary.testsPassed}/${this.results.summary.testsRun} passed`);
      console.log(`Evidence: ${this.results.summary.evidenceItems} items`);
      console.log(`Issues: ${this.results.summary.errors} errors, ${this.results.summary.warnings} warnings`);
      
    } catch (error) {
      this.results.status = 'VALIDATION_ERROR';
      this.results.errors.push(`Validation framework error: ${error.message}`);
      console.error(`❌ Validation failed: ${error.message}`);
    }
    
    return this.results;
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const reportName = `${timestamp}-${this.options.taskId}-flexible-validation.md`;
    
    const report = `# Flexible Validation Report - ${this.options.taskId}

## Summary
- **Status**: ${this.results.status}
- **Category**: ${this.options.category}
- **Tests Run**: ${this.results.summary.testsRun}
- **Tests Passed**: ${this.results.summary.testsPassed}
- **Evidence Items**: ${this.results.summary.evidenceItems}
- **Errors**: ${this.results.summary.errors}
- **Warnings**: ${this.results.summary.warnings}

## Test Results
${this.results.tests.map(test => 
  `- **${test.name}**: ${test.status}${test.error ? ` - ${test.error}` : ''}${test.details ? ` - ${JSON.stringify(test.details)}` : ''}`
).join('\n')}

## Evidence
${this.results.evidence.map(item => `- ${item}`).join('\n')}

## Issues Found
${this.results.errors.length > 0 ? '### Errors\n' + this.results.errors.map(item => `- ❌ ${item}`).join('\n') : ''}
${this.results.warnings.length > 0 ? '### Warnings\n' + this.results.warnings.map(item => `- ⚠️ ${item}`).join('\n') : ''}

## Recommendations
${this.results.status === 'VALIDATION_PASSED' ? 
  '✅ Task is ready to move to [D] (documenting) status.' :
  '❌ Task requires fixes before proceeding. Address errors above and re-run validation.'}

---
Generated by Flexible Validator at ${new Date().toISOString()}
`;

    return { reportName, report };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value === 'true' ? true : value === 'false' ? false : value;
  }
  
  const validator = new FlexibleValidator(options);
  
  validator.validate().then(results => {
    if (options.save) {
      const { reportName, report } = validator.generateReport();
      const reportPath = path.resolve('scripts/validation/results', reportName);
      
      import('fs').then(fs => {
        fs.writeFileSync(reportPath, report, 'utf8');
        console.log(`📄 Report saved: ${reportPath}`);
      });
    }
    
    process.exit(results.status === 'VALIDATION_PASSED' ? 0 : 1);
  }).catch(error => {
    console.error(`💥 Validation framework error: ${error.message}`);
    process.exit(2);
  });
}

export default FlexibleValidator;
