#!/usr/bin/env node

/**
 * Quality Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for Code Quality Tasks validation.
 * Extracted and implemented from Enhanced Validation System Gap Analysis Step 2
 * to support modular architecture with safety framework compliance.
 * 
 * Category: Code Quality Tasks
 * Description: ESLint compliance, code complexity analysis, technical debt assessment, refactoring recommendations
 * Source: IMPLEMENTATION-GAP-ANALYSIS.md Step 2 Quality Validator Requirements
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 * Interface Version: 3.0.0
 */


// Pattern: modular-validator-implementation (documented in templum-patterns.md)
// Implementation: Interface-compliance-validation approach following IValidator pattern

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Quality Validator implementing IValidator interface
 */
export class QualityValidator {
  constructor() {
    this.category = 'quality';
    this.version = '3.0.0';
    this.scopes = []; // Applies to determined scope, not its own scope
    this.hasIntegrationTests = true;
    
    // Initialize internal state
    this.validationStartTime = null;
  }

  /**
   * Main validation method implementing IValidator interface
   */
  async validate(projectInfo, scopeConfig, options = {}) {
    this.validationStartTime = Date.now();
    
    const result = {
      status: 'PENDING',
      tests: [],
      duration: 0,
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      console.log('  Executing Code Quality validation commands...');
      console.log('  Source: IMPLEMENTATION-GAP-ANALYSIS.md Step 2 Quality Validator Requirements');
      
      // Test 1: ESLint compliance checking
      const eslintTest = await this.executeESLintComplianceCheck(projectInfo, scopeConfig);
      result.tests.push(eslintTest);
      
      // Test 2: Code complexity analysis
      const complexityTest = await this.executeCodeComplexityAnalysis(projectInfo, scopeConfig);
      result.tests.push(complexityTest);
      
      // Test 3: Technical debt assessment
      const debtTest = await this.executeTechnicalDebtAssessment(projectInfo, scopeConfig);
      result.tests.push(debtTest);
      
      // Test 4: Refactoring recommendations
      const refactoringTest = await this.executeRefactoringRecommendations(projectInfo, scopeConfig);
      result.tests.push(refactoringTest);
      
      // Test 5: Maintainability scoring
      const maintainabilityTest = await this.executeMaintainabilityScoring(projectInfo, scopeConfig);
      result.tests.push(maintainabilityTest);

      // Determine overall result
      const failedTests = result.tests.filter(t => t.status === 'FAIL');
      const passedTests = result.tests.filter(t => t.status === 'PASS');
      const skippedTests = result.tests.filter(t => t.status === 'SKIP');
      
      if (failedTests.length > 0) {
        result.status = 'FAIL';
        result.errors.push(`${failedTests.length} tests failed`);
      } else if (passedTests.length > 0) {
        result.status = 'PASS';
      } else if (skippedTests.length > 0) {
        result.status = 'WARN';
        result.warnings.push('All tests were skipped');
      }
      
      // Collect evidence and errors from tests
      for (const test of result.tests) {
        if (test.evidence) result.evidence.push(...test.evidence);
        if (test.errors) result.errors.push(...test.errors);
        if (test.warnings) result.warnings.push(...test.warnings);
      }
      
      result.duration = Date.now() - this.validationStartTime;
      console.log('  Code Quality validation tests completed');
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Quality validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
      return result;
    }
  }

  /**
   * Execute ESLint compliance checking
   */
  async executeESLintComplianceCheck(projectInfo, scopeConfig) {
    console.log('    ESLint Compliance Check...');
    const test = {
      name: 'ESLint Compliance Check',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const eslintConfigPath = path.join(projectInfo.path, '.eslintrc.js');
      const eslintConfigExists = fs.existsSync(eslintConfigPath) || 
                                fs.existsSync(path.join(projectInfo.path, '.eslintrc.json')) ||
                                fs.existsSync(path.join(projectInfo.path, 'eslint.config.js'));
      
      if (!eslintConfigExists) {
        test.status = 'WARN';
        test.message = 'No ESLint configuration found';
        test.evidence.push('No ESLint configuration file found in project root');
        console.log('      🟡 WARN - No ESLint configuration found');
        return test;
      }

      // Find files in scope to check
      const filesToCheck = this.findFilesInScope(projectInfo, scopeConfig.patterns || ['**/*.ts', '**/*.js']);
      
      if (filesToCheck.length === 0) {
        test.status = 'SKIP';
        test.message = 'No files found in scope for ESLint validation';
        test.evidence.push('No TypeScript or JavaScript files found in specified scope');
        console.log('      ⏭️ SKIP - No files found in scope');
        return test;
      }

      let totalIssues = 0;
      let filesWithIssues = 0;
      let totalFiles = Math.min(filesToCheck.length, 10); // Limit to 10 files for performance
      
      // Check a sample of files for ESLint issues
      for (let i = 0; i < totalFiles; i++) {
        const file = filesToCheck[i];
        try {
          // Run ESLint on individual file to check for issues
          const eslintResult = execSync(`npx eslint "${file}" --format json`, { 
            cwd: projectInfo.path, 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          const lintResults = JSON.parse(eslintResult);
          if (lintResults.length > 0 && lintResults[0].messages.length > 0) {
            filesWithIssues++;
            totalIssues += lintResults[0].messages.length;
          }
          
          test.evidence.push(`ESLint checked: ${path.relative(projectInfo.path, file)} (${lintResults[0]?.messages?.length || 0} issues)`);
        } catch (eslintError) {
          // ESLint errors indicate issues exist
          if (eslintError.stdout) {
            try {
              const lintResults = JSON.parse(eslintError.stdout);
              if (lintResults.length > 0 && lintResults[0].messages) {
                filesWithIssues++;
                totalIssues += lintResults[0].messages.length;
                test.evidence.push(`ESLint issues found in: ${path.relative(projectInfo.path, file)} (${lintResults[0].messages.length} issues)`);
              }
            } catch (parseError) {
              test.evidence.push(`ESLint check failed for: ${path.relative(projectInfo.path, file)}`);
            }
          }
        }
      }

      // Determine result based on issues found
      if (totalIssues === 0) {
        test.status = 'PASS';
        test.message = 'ESLint compliance check passed';
        test.evidence.push(`All ${totalFiles} checked files pass ESLint validation`);
        console.log('      ✅ PASS - ESLint compliance check passed');
      } else if (totalIssues < 10) {
        test.status = 'WARN';
        test.message = 'Minor ESLint issues found';
        test.evidence.push(`${totalIssues} ESLint issues found in ${filesWithIssues}/${totalFiles} files`);
        console.log('      🟡 WARN - Minor ESLint issues found');
      } else {
        test.status = 'FAIL';
        test.message = 'Significant ESLint issues found';
        test.errors.push(`${totalIssues} ESLint issues found across ${filesWithIssues} files`);
        console.log('      ❌ FAIL - Significant ESLint issues found');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'ESLint compliance check failed';
      test.errors.push(`ESLint validation error: ${error.message}`);
      console.log('      ❌ FAIL - ESLint compliance check failed');
    }

    return test;
  }

  /**
   * Execute code complexity analysis
   */
  async executeCodeComplexityAnalysis(projectInfo, scopeConfig) {
    console.log('    Code Complexity Analysis...');
    const test = {
      name: 'Code Complexity Analysis',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const filesToAnalyze = this.findFilesInScope(projectInfo, scopeConfig.patterns || ['**/*.ts', '**/*.js']);
      
      if (filesToAnalyze.length === 0) {
        test.status = 'SKIP';
        test.message = 'No files found for complexity analysis';
        test.evidence.push('No TypeScript or JavaScript files found in specified scope');
        console.log('      ⏭️ SKIP - No files found for analysis');
        return test;
      }

      let totalComplexity = 0;
      let highComplexityFiles = 0;
      let filesAnalyzed = 0;
      const maxFilesToAnalyze = Math.min(filesToAnalyze.length, 15); // Limit for performance

      for (let i = 0; i < maxFilesToAnalyze; i++) {
        const file = filesToAnalyze[i];
        try {
          const content = fs.readFileSync(file, 'utf8');
          const complexity = this.calculateCyclomaticComplexity(content);
          totalComplexity += complexity;
          filesAnalyzed++;
          
          if (complexity > 10) {
            highComplexityFiles++;
          }
          
          test.evidence.push(`Complexity analysis: ${path.relative(projectInfo.path, file)} (complexity: ${complexity})`);
        } catch (readError) {
          test.evidence.push(`Could not analyze: ${path.relative(projectInfo.path, file)}`);
        }
      }

      const averageComplexity = filesAnalyzed > 0 ? totalComplexity / filesAnalyzed : 0;

      if (averageComplexity <= 5 && highComplexityFiles === 0) {
        test.status = 'PASS';
        test.message = 'Code complexity analysis passed';
        test.evidence.push(`Average complexity: ${averageComplexity.toFixed(2)} (excellent)`);
        console.log('      ✅ PASS - Code complexity analysis passed');
      } else if (averageComplexity <= 8 && highComplexityFiles < filesAnalyzed * 0.2) {
        test.status = 'WARN';
        test.message = 'Moderate code complexity found';
        test.evidence.push(`Average complexity: ${averageComplexity.toFixed(2)}, ${highComplexityFiles} high-complexity files`);
        console.log('      🟡 WARN - Moderate code complexity found');
      } else {
        test.status = 'FAIL';
        test.message = 'High code complexity detected';
        test.errors.push(`Average complexity: ${averageComplexity.toFixed(2)}, ${highComplexityFiles} high-complexity files need refactoring`);
        console.log('      ❌ FAIL - High code complexity detected');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Code complexity analysis failed';
      test.errors.push(`Complexity analysis error: ${error.message}`);
      console.log('      ❌ FAIL - Code complexity analysis failed');
    }

    return test;
  }

  /**
   * Execute technical debt assessment
   */
  async executeTechnicalDebtAssessment(projectInfo, scopeConfig) {
    console.log('    Technical Debt Assessment...');
    const test = {
      name: 'Technical Debt Assessment',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const filesToAssess = this.findFilesInScope(projectInfo, scopeConfig.patterns || ['**/*.ts', '**/*.js']);
      
      if (filesToAssess.length === 0) {
        test.status = 'SKIP';
        test.message = 'No files found for technical debt assessment';
        test.evidence.push('No TypeScript or JavaScript files found in specified scope');
        console.log('      ⏭️ SKIP - No files found for assessment');
        return test;
      }

      let totalDebtIndicators = 0;
      let filesWithDebt = 0;
      const maxFilesToCheck = Math.min(filesToAssess.length, 20); // Limit for performance

      const debtPatterns = [
        /TODO:/gi,
        /FIXME:/gi,
        /HACK:/gi,
        /XXX:/gi,
        /BUG:/gi,
        /NOTE:/gi,
        /DEPRECATED/gi,
        /any/gi, // TypeScript 'any' type usage
        /console\.log/gi, // Debug console logs left in code
        /debugger;/gi // Debugger statements
      ];

      for (let i = 0; i < maxFilesToCheck; i++) {
        const file = filesToAssess[i];
        try {
          const content = fs.readFileSync(file, 'utf8');
          let fileDebtCount = 0;
          
          for (const pattern of debtPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              fileDebtCount += matches.length;
            }
          }
          
          if (fileDebtCount > 0) {
            filesWithDebt++;
            totalDebtIndicators += fileDebtCount;
          }
          
          test.evidence.push(`Debt assessment: ${path.relative(projectInfo.path, file)} (${fileDebtCount} indicators)`);
        } catch (readError) {
          test.evidence.push(`Could not assess: ${path.relative(projectInfo.path, file)}`);
        }
      }

      const debtRatio = maxFilesToCheck > 0 ? filesWithDebt / maxFilesToCheck : 0;

      if (totalDebtIndicators <= 5 && debtRatio <= 0.2) {
        test.status = 'PASS';
        test.message = 'Technical debt assessment passed';
        test.evidence.push(`Low technical debt: ${totalDebtIndicators} indicators in ${filesWithDebt} files`);
        console.log('      ✅ PASS - Technical debt assessment passed');
      } else if (totalDebtIndicators <= 20 && debtRatio <= 0.5) {
        test.status = 'WARN';
        test.message = 'Moderate technical debt detected';
        test.evidence.push(`Moderate technical debt: ${totalDebtIndicators} indicators in ${filesWithDebt} files`);
        console.log('      🟡 WARN - Moderate technical debt detected');
      } else {
        test.status = 'FAIL';
        test.message = 'High technical debt detected';
        test.errors.push(`High technical debt: ${totalDebtIndicators} indicators across ${filesWithDebt} files require attention`);
        console.log('      ❌ FAIL - High technical debt detected');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Technical debt assessment failed';
      test.errors.push(`Technical debt assessment error: ${error.message}`);
      console.log('      ❌ FAIL - Technical debt assessment failed');
    }

    return test;
  }

  /**
   * Execute refactoring recommendations
   */
  async executeRefactoringRecommendations(projectInfo, scopeConfig) {
    console.log('    Refactoring Recommendations...');
    const test = {
      name: 'Refactoring Recommendations',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const filesToCheck = this.findFilesInScope(projectInfo, scopeConfig.patterns || ['**/*.ts', '**/*.js']);
      
      if (filesToCheck.length === 0) {
        test.status = 'SKIP';
        test.message = 'No files found for refactoring analysis';
        test.evidence.push('No TypeScript or JavaScript files found in specified scope');
        console.log('      ⏭️ SKIP - No files found for analysis');
        return test;
      }

      const recommendations = [];
      const maxFilesToCheck = Math.min(filesToCheck.length, 15); // Limit for performance

      for (let i = 0; i < maxFilesToCheck; i++) {
        const file = filesToCheck[i];
        try {
          const content = fs.readFileSync(file, 'utf8');
          const fileRecommendations = this.analyzeForRefactoringOpportunities(content, file, projectInfo);
          recommendations.push(...fileRecommendations);
          
          test.evidence.push(`Refactoring analysis: ${path.relative(projectInfo.path, file)} (${fileRecommendations.length} recommendations)`);
        } catch (readError) {
          test.evidence.push(`Could not analyze: ${path.relative(projectInfo.path, file)}`);
        }
      }

      // Categorize recommendations by priority
      const highPriority = recommendations.filter(r => r.priority === 'high');
      const mediumPriority = recommendations.filter(r => r.priority === 'medium');
      const lowPriority = recommendations.filter(r => r.priority === 'low');

      if (recommendations.length === 0) {
        test.status = 'PASS';
        test.message = 'No refactoring recommendations needed';
        test.evidence.push('Code quality appears good, no immediate refactoring needed');
        console.log('      ✅ PASS - No refactoring recommendations needed');
      } else if (highPriority.length === 0 && mediumPriority.length <= 3) {
        test.status = 'PASS';
        test.message = 'Minor refactoring opportunities identified';
        test.evidence.push(`${recommendations.length} minor refactoring opportunities identified`);
        if (recommendations.length > 0) {
          test.warnings = recommendations.slice(0, 3).map(r => r.description);
        }
        console.log('      ✅ PASS - Minor refactoring opportunities identified');
      } else if (highPriority.length <= 2) {
        test.status = 'WARN';
        test.message = 'Moderate refactoring recommended';
        test.evidence.push(`${recommendations.length} refactoring opportunities (${highPriority.length} high priority)`);
        test.warnings = recommendations.slice(0, 5).map(r => r.description);
        console.log('      🟡 WARN - Moderate refactoring recommended');
      } else {
        test.status = 'FAIL';
        test.message = 'Significant refactoring needed';
        test.errors.push(`${recommendations.length} refactoring opportunities (${highPriority.length} high priority) require attention`);
        console.log('      ❌ FAIL - Significant refactoring needed');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Refactoring recommendations analysis failed';
      test.errors.push(`Refactoring analysis error: ${error.message}`);
      console.log('      ❌ FAIL - Refactoring recommendations analysis failed');
    }

    return test;
  }

  /**
   * Execute maintainability scoring
   */
  async executeMaintainabilityScoring(projectInfo, scopeConfig) {
    console.log('    Maintainability Scoring...');
    const test = {
      name: 'Maintainability Scoring',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const filesToScore = this.findFilesInScope(projectInfo, scopeConfig.patterns || ['**/*.ts', '**/*.js']);
      
      if (filesToScore.length === 0) {
        test.status = 'SKIP';
        test.message = 'No files found for maintainability scoring';
        test.evidence.push('No TypeScript or JavaScript files found in specified scope');
        console.log('      ⏭️ SKIP - No files found for scoring');
        return test;
      }

      let totalScore = 0;
      let filesScored = 0;
      const maxFilesToScore = Math.min(filesToScore.length, 20); // Limit for performance

      for (let i = 0; i < maxFilesToScore; i++) {
        const file = filesToScore[i];
        try {
          const content = fs.readFileSync(file, 'utf8');
          const score = this.calculateMaintainabilityScore(content);
          totalScore += score;
          filesScored++;
          
          test.evidence.push(`Maintainability score: ${path.relative(projectInfo.path, file)} (${score}/100)`);
        } catch (readError) {
          test.evidence.push(`Could not score: ${path.relative(projectInfo.path, file)}`);
        }
      }

      const averageScore = filesScored > 0 ? totalScore / filesScored : 0;

      if (averageScore >= 80) {
        test.status = 'PASS';
        test.message = 'Maintainability scoring passed';
        test.evidence.push(`Excellent maintainability score: ${averageScore.toFixed(1)}/100`);
        console.log('      ✅ PASS - Maintainability scoring passed');
      } else if (averageScore >= 60) {
        test.status = 'WARN';
        test.message = 'Moderate maintainability score';
        test.evidence.push(`Moderate maintainability score: ${averageScore.toFixed(1)}/100 - consider improvements`);
        console.log('      🟡 WARN - Moderate maintainability score');
      } else {
        test.status = 'FAIL';
        test.message = 'Low maintainability score';
        test.errors.push(`Low maintainability score: ${averageScore.toFixed(1)}/100 - requires improvement`);
        console.log('      ❌ FAIL - Low maintainability score');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Maintainability scoring failed';
      test.errors.push(`Maintainability scoring error: ${error.message}`);
      console.log('      ❌ FAIL - Maintainability scoring failed');
    }

    return test;
  }

  /**
   * Calculate cyclomatic complexity for a file
   */
  calculateCyclomaticComplexity(content) {
    // Simple complexity calculation based on decision points
    const complexityPatterns = [
      /if\s*\(/gi,
      /else\s+if\s*\(/gi,
      /while\s*\(/gi,
      /for\s*\(/gi,
      /switch\s*\(/gi,
      /case\s+/gi,
      /catch\s*\(/gi,
      /\?\s*.*\s*:/gi, // Ternary operator
      /&&/gi,
      /\|\|/gi
    ];

    let complexity = 1; // Base complexity

    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Analyze file for refactoring opportunities
   */
  analyzeForRefactoringOpportunities(content, filePath, projectInfo) {
    const recommendations = [];
    const lines = content.split('\n');
    
    // Check for long functions (> 50 lines)
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g);
    if (functionMatches && lines.length > 50) {
      recommendations.push({
        type: 'function-length',
        priority: 'medium',
        description: `File has ${lines.length} lines - consider breaking into smaller functions`,
        file: path.relative(projectInfo.path, filePath)
      });
    }

    // Check for duplicate code patterns
    const duplicateLines = this.findDuplicateLines(lines);
    if (duplicateLines.length > 3) {
      recommendations.push({
        type: 'code-duplication',
        priority: 'high',
        description: `${duplicateLines.length} duplicate lines detected - consider extracting common functionality`,
        file: path.relative(projectInfo.path, filePath)
      });
    }

    // Check for deeply nested code
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    
    if (maxNesting > 4) {
      recommendations.push({
        type: 'deep-nesting',
        priority: 'medium',
        description: `Deep nesting detected (level ${maxNesting}) - consider extracting methods`,
        file: path.relative(projectInfo.path, filePath)
      });
    }

    // Check for large parameter lists
    const parameterMatches = content.match(/function\s+\w+\s*\([^)]{50,}\)|const\s+\w+\s*=\s*\([^)]{50,}\)/g);
    if (parameterMatches && parameterMatches.length > 0) {
      recommendations.push({
        type: 'parameter-list',
        priority: 'low',
        description: 'Long parameter lists detected - consider using configuration objects',
        file: path.relative(projectInfo.path, filePath)
      });
    }

    return recommendations;
  }

  /**
   * Find duplicate lines in code
   */
  findDuplicateLines(lines) {
    const lineCount = {};
    const duplicates = [];

    // Count non-empty, non-comment lines
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
        lineCount[trimmed] = (lineCount[trimmed] || 0) + 1;
      }
    }

    // Find duplicates
    for (const [line, count] of Object.entries(lineCount)) {
      if (count > 1) {
        duplicates.push(line);
      }
    }

    return duplicates;
  }

  /**
   * Calculate maintainability score (0-100)
   */
  calculateMaintainabilityScore(content) {
    let score = 100;
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    // Penalize based on file length
    if (nonEmptyLines.length > 200) {
      score -= 20;
    } else if (nonEmptyLines.length > 100) {
      score -= 10;
    }

    // Penalize based on complexity
    const complexity = this.calculateCyclomaticComplexity(content);
    if (complexity > 15) {
      score -= 30;
    } else if (complexity > 10) {
      score -= 15;
    } else if (complexity > 5) {
      score -= 5;
    }

    // Penalize for lack of comments
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
    });
    const commentRatio = nonEmptyLines.length > 0 ? commentLines.length / nonEmptyLines.length : 0;
    if (commentRatio < 0.1) {
      score -= 15;
    } else if (commentRatio < 0.05) {
      score -= 25;
    }

    // Penalize for technical debt indicators
    const debtIndicators = (content.match(/TODO:|FIXME:|HACK:|XXX:/gi) || []).length;
    score -= Math.min(debtIndicators * 5, 20);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Find files matching patterns in project scope
   */
  findFilesInScope(projectInfo, patterns) {
    const files = [];
    
    try {
      for (const pattern of patterns) {
        // Handle both specific scope patterns and general patterns
        if (pattern.includes('**')) {
          // Handle recursive patterns
          const basePattern = pattern.replace('**/', '').replace('**\\', '');
          const searchPath = path.join(projectInfo.path, 'src');
          
          if (fs.existsSync(searchPath)) {
            this.walkDirectory(searchPath, basePattern, files);
          }
        } else {
          // Handle simple patterns
          const searchPath = path.join(projectInfo.path, pattern);
          if (fs.existsSync(searchPath)) {
            files.push(searchPath);
          }
        }
      }
    } catch (error) {
      console.log(`      Warning: Error finding files: ${error.message}`);
    }
    
    return files;
  }

  /**
   * Walk directory recursively to find matching files
   */
  walkDirectory(dir, pattern, results) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          this.walkDirectory(filePath, pattern, results);
        } else if (this.matchesPattern(file, pattern)) {
          results.push(filePath);
        }
      }
    } catch (error) {
      // Ignore directory access errors
    }
  }

  /**
   * Check if filename matches a simple pattern
   */
  matchesPattern(filename, pattern) {
    // Convert simple glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(filename);
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['Templum', 'Haruspex', 'phoenix-code-lite'],
      supportedScopes: this.scopes,
      requiredDependencies: ['eslint', 'prettier'],
      performanceProfile: 'standard',
      hasIntegrationTests: true,
      supportsRollback: false
    };
  }

  /**
   * Get validator metadata
   */
  getMetadata() {
    return {
      category: this.category,
      version: this.version,
      interfaceVersion: '3.0.0',
      generated: false,
      generatedAt: null,
      template: null,
      author: 'Enhanced Validation System',
      description: 'Code Quality Tasks - ESLint fixes, refactoring, cleanup, maintainability scoring',
      lastValidated: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Check interface compliance
   */
  checkInterfaceCompliance() {
    const requiredMethods = [
      'validate', 'getCapabilities', 'checkInterfaceCompliance', 
      'runSelfDiagnostics', 'getMetadata'
    ];
    return requiredMethods.every(method => typeof this[method] === 'function');
  }

  /**
   * Run self-diagnostics
   */
  runSelfDiagnostics() {
    const checks = [
      {
        name: 'Interface Compliance',
        status: this.checkInterfaceCompliance()
      },
      {
        name: 'File System Access',
        status: this.checkFileSystemAccess()
      },
      {
        name: 'Pattern Matching',
        status: this.checkPatternMatching()
      },
      {
        name: 'ESLint Availability',
        status: this.checkESLintAvailability()
      }
    ];

    return {
      status: checks.every(c => c.status) ? 'healthy' : 'warning',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check file system access capability
   */
  checkFileSystemAccess() {
    try {
      const tempPath = path.join(process.cwd(), 'temp-access-test');
      fs.writeFileSync(tempPath, 'test');
      fs.unlinkSync(tempPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check pattern matching capability
   */
  checkPatternMatching() {
    try {
      const testPattern = '*.ts';
      const testFile = 'test.ts';
      return this.matchesPattern(testFile, testPattern);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check ESLint availability
   */
  checkESLintAvailability() {
    try {
      execSync('npx eslint --version', { 
        stdio: 'pipe',
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default QualityValidator;