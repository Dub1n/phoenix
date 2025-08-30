#!/usr/bin/env node

/**
 * Complexity Estimation Script
 * 
 * Purpose: Estimates fix complexity using quantitative scoring from shared-components.md
 * Usage: npm run estimate:complexity <issue-id>
 * Integration: Used by issue-fix-selector.md and comprehensive-fix-guide.md
 * 
 * Functionality:
 * - Parse issue from Implementation Tracker (*-tracker-data.md format)
 * - Count affected files and dependencies using shared-components.md framework
 * - Assess uncertainty level based on error clarity
 * - Calculate complexity score: (Files × 1) + (Dependencies × 2) + (Uncertainty × 3)
 * - Recommend template: quick-fix-guide.md (0-7) or comprehensive-fix-guide.md (8+)
 * - Output in format compatible with tracker updates
 * 
 * Input: Issue ID or component name from tracker
 * Output: Complexity assessment with numerical score and template recommendation
 */

import fs from 'fs';
import path from 'path';
import {
  STATUS,
  PRIORITY,
  ProjectDetector,
  ComponentSearcher,
  DependencyAnalyzer,
  EvidenceGenerator,
  ValidationUtils
} from './validation-helpers.js';

// Complexity scoring constants
const COMPLEXITY_WEIGHTS = {
  FILES: 1,
  DEPENDENCIES: 2,
  UNCERTAINTY: 3
};

const COMPLEXITY_LEVELS = {
  LOW: { min: 0, max: 7, template: 'quick-fix-guide.md', timeEstimate: '1-3 hours' },
  LOW_MEDIUM: { min: 8, max: 14, template: 'comprehensive-fix-guide.md', timeEstimate: '3-6 hours' },
  MEDIUM: { min: 15, max: 21, template: 'comprehensive-fix-guide.md', timeEstimate: '6-12 hours' },
  HIGH: { min: 22, max: 28, template: 'comprehensive-fix-guide.md', timeEstimate: '12-24 hours' },
  VERY_HIGH: { min: 29, max: 35, template: 'comprehensive-fix-guide.md', timeEstimate: '1-3 days' }
};

class ComplexityEstimator {
  constructor(issueId) {
    this.issueId = issueId;
    this.detector = new ProjectDetector();
    this.searcher = new ComponentSearcher(this.detector);
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.evidenceGenerator = new EvidenceGenerator(this.detector);
    
    this.estimation = {
      issueId,
      timestamp: new Date().toISOString(),
      filesScore: 0,
      dependenciesScore: 0,
      uncertaintyScore: 0,
      totalScore: 0,
      complexityLevel: '',
      template: '',
      timeEstimate: '',
      filesAffected: [],
      dependencies: [],
      uncertaintyFactors: [],
      recommendations: []
    };
  }

  /**
   * Main estimation workflow
   */
  async estimate() {
    this.detector.logProjectInfo();
    console.log(`\nEstimating complexity for issue: ${this.issueId}`);
    console.log('=' .repeat(50));

    try {
      await this.parseIssueFromTracker();
      await this.analyzeFiles();
      await this.analyzeDependencies();
      await this.assessUncertainty();
      await this.calculateComplexity();
      await this.generateRecommendations();
      await this.saveResults();
      this.displayResults();
    } catch (error) {
      console.error(`❌ Estimation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Parse issue information from tracker data
   */
  async parseIssueFromTracker() {
    console.log('\nParsing issue from tracker data...');
    
    // Try to find tracker data files
    const trackerFiles = this.findTrackerFiles();
    
    if (trackerFiles.length === 0) {
      console.log('No tracker files found, treating as component name');
      // Treat issueId as component name
      const componentFiles = this.searcher.findComponentFiles(this.issueId);
      this.estimation.filesAffected = componentFiles;
      console.log(`Found ${componentFiles.length} files for component: ${this.issueId}`);
      return;
    }

    // Parse tracker files to find the issue
    for (const trackerFile of trackerFiles) {
      const trackerContent = fs.readFileSync(trackerFile, 'utf8');
      const issueMatch = this.parseTrackerContent(trackerContent);
      
      if (issueMatch) {
        console.log(`Found issue in tracker: ${path.relative(this.detector.getProjectRoot(), trackerFile)}`);
        this.estimation.filesAffected = issueMatch.files || [];
        this.estimation.dependencies = issueMatch.dependencies || [];
        this.estimation.uncertaintyFactors = issueMatch.uncertaintyFactors || [];
        break;
      }
    }

    if (this.estimation.filesAffected.length === 0) {
      console.log(`Issue not found in trackers, treating as component name: ${this.issueId}`);
      const componentFiles = this.searcher.findComponentFiles(this.issueId);
      this.estimation.filesAffected = componentFiles;
    }
  }

  /**
   * Find tracker data files in the project
   */
  findTrackerFiles() {
    const trackerFiles = [];
    const searchPaths = [
      path.join(this.detector.getProjectRoot(), 'dev'),
      path.join(this.detector.getProjectRoot(), 'Haruspex', 'dev'),
      path.join(this.detector.getProjectRoot(), 'phoenix-code-lite', 'dev'),
      this.detector.getProjectRoot()
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        try {
          const files = fs.readdirSync(searchPath);
          files.forEach(file => {
            if (file.includes('tracker-data') && file.endsWith('.md')) {
              trackerFiles.push(path.join(searchPath, file));
            }
          });
        } catch (error) {
          // Ignore permission errors
        }
      }
    }

    return trackerFiles;
  }

  /**
   * Parse tracker content to extract issue information
   */
  parseTrackerContent(content) {
    // Simple parsing - look for component name in tables or lists
    const lines = content.split('\n');
    let foundIssue = null;

    for (const line of lines) {
      if (line.includes(this.issueId)) {
        // Extract information from the line
        const files = this.extractFilePaths(line);
        const dependencies = this.extractDependencies(content);
        const uncertaintyFactors = this.extractUncertaintyFactors(line);
        
        foundIssue = {
          files,
          dependencies,
          uncertaintyFactors
        };
        break;
      }
    }

    return foundIssue;
  }

  /**
   * Extract file paths from tracker content
   */
  extractFilePaths(content) {
    const filePattern = /[`"]([^`"]*\.ts)[`"]/g;
    const files = [];
    let match;

    while ((match = filePattern.exec(content)) !== null) {
      const filePath = match[1];
      // Convert to full path if needed
      const fullPath = this.resolveFilePath(filePath);
      if (fullPath && fs.existsSync(fullPath)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Resolve relative file path to full path
   */
  resolveFilePath(relativePath) {
    const possiblePaths = [
      path.join(this.detector.getProjectRoot(), relativePath),
      ...this.detector.getSourceDirectories().map(srcDir => 
        path.join(path.dirname(srcDir), relativePath)
      )
    ];

    for (const fullPath of possiblePaths) {
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  /**
   * Extract dependencies from content
   */
  extractDependencies(content) {
    // Look for dependency indicators
    const dependencyPattern = /import.*from\s+['"]([^'"]+)['"]/g;
    const dependencies = new Set();
    let match;

    while ((match = dependencyPattern.exec(content)) !== null) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('@')) {
        dependencies.add(dep);
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Extract uncertainty factors
   */
  extractUncertaintyFactors(content) {
    const uncertaintyIndicators = [
      'missing', 'broken', 'unclear', 'investigation', 'unknown', 'complex',
      'architectural', 'requires research', 'dependency', 'integration'
    ];

    const factors = [];
    const lowerContent = content.toLowerCase();

    uncertaintyIndicators.forEach(indicator => {
      if (lowerContent.includes(indicator)) {
        factors.push(indicator);
      }
    });

    return factors;
  }

  /**
   * Analyze affected files
   */
  async analyzeFiles() {
    console.log('\nAnalyzing affected files...');
    
    const fileCount = this.estimation.filesAffected.length;
    
    // Score based on number of files (1-5 scale)
    if (fileCount <= 1) {
      this.estimation.filesScore = 1;
    } else if (fileCount <= 3) {
      this.estimation.filesScore = 2;
    } else if (fileCount <= 5) {
      this.estimation.filesScore = 3;
    } else if (fileCount <= 10) {
      this.estimation.filesScore = 4;
    } else {
      this.estimation.filesScore = 5;
    }

    console.log(`Files affected: ${fileCount} (Score: ${this.estimation.filesScore})`);
    this.estimation.filesAffected.forEach(file => {
      console.log(`    - ${path.relative(this.detector.getProjectRoot(), file)}`);
    });
  }

  /**
   * Analyze dependencies
   */
  async analyzeDependencies() {
    console.log('\nAnalyzing dependencies...');
    
    // Analyze dependencies from actual files if available
    if (this.estimation.filesAffected.length > 0) {
      const fileDependencies = this.dependencyAnalyzer.analyzeDependencies(this.estimation.filesAffected);
      this.estimation.dependencies = [...new Set([...this.estimation.dependencies, ...fileDependencies])];
    }

    const depCount = this.estimation.dependencies.length;
    
    // Score based on number of dependencies (1-5 scale)
    if (depCount === 0) {
      this.estimation.dependenciesScore = 1;
    } else if (depCount <= 2) {
      this.estimation.dependenciesScore = 2;
    } else if (depCount <= 5) {
      this.estimation.dependenciesScore = 3;
    } else if (depCount <= 10) {
      this.estimation.dependenciesScore = 4;
    } else {
      this.estimation.dependenciesScore = 5;
    }

    console.log(`Dependencies: ${depCount} (Score: ${this.estimation.dependenciesScore})`);
    this.estimation.dependencies.forEach(dep => console.log(`    - ${dep}`));
  }

  /**
   * Assess uncertainty level
   */
  async assessUncertainty() {
    console.log('\nAssessing uncertainty level...');
    
    const factors = this.estimation.uncertaintyFactors;
    let uncertaintyScore = 1; // Default low uncertainty

    // Increase uncertainty based on factors
    if (factors.includes('missing') || factors.includes('broken')) {
      uncertaintyScore = Math.max(uncertaintyScore, 3);
    }
    if (factors.includes('architectural') || factors.includes('integration')) {
      uncertaintyScore = Math.max(uncertaintyScore, 4);
    }
    if (factors.includes('unknown') || factors.includes('requires research')) {
      uncertaintyScore = Math.max(uncertaintyScore, 5);
    }
    if (factors.includes('complex')) {
      uncertaintyScore = Math.max(uncertaintyScore, 4);
    }

    this.estimation.uncertaintyScore = uncertaintyScore;

    const uncertaintyLevel = ['Very Clear', 'Clear', 'Some Investigation', 'Significant Research', 'Highly Uncertain'][uncertaintyScore - 1];
    console.log(`Uncertainty: ${uncertaintyLevel} (Score: ${uncertaintyScore})`);
    if (factors.length > 0) {
      console.log('Uncertainty factors:');
      factors.forEach(factor => console.log(`    - ${factor}`));
    }
  }

  /**
   * Calculate total complexity score
   */
  async calculateComplexity() {
    console.log('\nCalculating complexity score...');
    
    const filesContribution = this.estimation.filesScore * COMPLEXITY_WEIGHTS.FILES;
    const depsContribution = this.estimation.dependenciesScore * COMPLEXITY_WEIGHTS.DEPENDENCIES;
    const uncertaintyContribution = this.estimation.uncertaintyScore * COMPLEXITY_WEIGHTS.UNCERTAINTY;
    
    this.estimation.totalScore = filesContribution + depsContribution + uncertaintyContribution;

    // Determine complexity level
    for (const [level, config] of Object.entries(COMPLEXITY_LEVELS)) {
      if (this.estimation.totalScore >= config.min && this.estimation.totalScore <= config.max) {
        this.estimation.complexityLevel = level;
        this.estimation.template = config.template;
        this.estimation.timeEstimate = config.timeEstimate;
        break;
      }
    }

    // Handle edge cases
    if (!this.estimation.complexityLevel) {
      this.estimation.complexityLevel = 'EXTREME';
      this.estimation.template = 'comprehensive-fix-guide.md';
      this.estimation.timeEstimate = '3+ days';
    }

    console.log(`    Complexity calculation:`);
    console.log(`    Files: ${this.estimation.filesScore} × ${COMPLEXITY_WEIGHTS.FILES} = ${filesContribution}`);
    console.log(`    Dependencies: ${this.estimation.dependenciesScore} × ${COMPLEXITY_WEIGHTS.DEPENDENCIES} = ${depsContribution}`);
    console.log(`    Uncertainty: ${this.estimation.uncertaintyScore} × ${COMPLEXITY_WEIGHTS.UNCERTAINTY} = ${uncertaintyContribution}`);
    console.log(`    Total Score: ${this.estimation.totalScore}`);
    console.log(`    Complexity Level: ${this.estimation.complexityLevel}`);
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    console.log('\nGenerating recommendations...');
    
    const recommendations = [];

    // Template recommendation
    recommendations.push(`Use ${this.estimation.template} template for this fix`);
    recommendations.push(`Estimated time investment: ${this.estimation.timeEstimate}`);

    // Specific recommendations based on complexity
    if (this.estimation.totalScore >= 22) {
      recommendations.push('Consider breaking this into smaller, incremental fixes');
      recommendations.push('Plan for comprehensive testing and validation');
    }

    if (this.estimation.uncertaintyScore >= 4) {
      recommendations.push('Conduct thorough investigation before implementation');
      recommendations.push('Consider architectural review or expert consultation');
    }

    if (this.estimation.dependenciesScore >= 4) {
      recommendations.push('Review all dependency impacts before making changes');
      recommendations.push('Plan for integration testing across dependent components');
    }

    if (this.estimation.filesScore >= 4) {
      recommendations.push('Use systematic approach to coordinate changes across multiple files');
      recommendations.push('Consider using version control branching strategy');
    }

    this.estimation.recommendations = recommendations;
    
    recommendations.forEach(rec => console.log(`  ${rec}`));
  }

  /**
   * Save estimation results
   */
  async saveResults() {
    const resultsDir = this.detector.getValidationResultsDir();
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${this.issueId}-complexity.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.estimation, null, 2));
    console.log(`\nResults saved to: ${path.relative(this.detector.getProjectRoot(), filepath)}`);
  }

  /**
   * Display estimation results
   */
  displayResults() {
    console.log('\n' + '='.repeat(50));
    console.log(`COMPLEXITY ESTIMATION: ${this.issueId.toUpperCase()}`);
    console.log('='.repeat(50));
    
    console.log(`\nComplexity Score: ${this.estimation.totalScore} (${this.estimation.complexityLevel})`);
    console.log(`Template: ${this.estimation.template}`);
    console.log(`Timestamp: ${this.estimation.timestamp}`);
    
    console.log(`\nFiles Affected: ${this.estimation.filesAffected.length} (Score: ${this.estimation.filesScore})`);
    console.log(`Dependencies: ${this.estimation.dependencies.length} (Score: ${this.estimation.dependenciesScore})`);
    console.log(`Uncertainty: ${this.estimation.uncertaintyScore}/5`);
    
    console.log(`\nRecommendations:`);
    this.estimation.recommendations.forEach(rec => {
      console.log(`${rec}`);
    });
    
    console.log('\n' + '='.repeat(50));
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting complexity estimation...');
  
  const args = process.argv.slice(2);
  ValidationUtils.validateArgs(args, 1, 'Usage: node estimate-complexity.js <issue-id>');

  const issueId = args[0];
  console.log(`Issue to estimate: ${issueId}`);
  
  try {
    console.log('Creating estimator instance...');
    const estimator = new ComplexityEstimator(issueId);
    console.log('Estimator created, starting estimation...');
    await estimator.estimate();
    console.log('Complexity estimation completed successfully!');
  } catch (error) {
    console.error(`Estimation failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
