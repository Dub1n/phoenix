/**
 * Haruspex Truth Calculator Implementation
 * 
 * Calculates truth matrix and health scores for codebase analysis,
 * providing insights into code quality, architecture, and documentation health.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import * as path from 'path';
import * as fs from 'fs/promises';

export interface TruthMatrix {
  /** Overall health score (0-100) */
  overallHealthScore: number;
  /** List of validation errors if any */
  validationErrors?: readonly string[];
  /** Detailed health metrics */
  healthMetrics?: HealthMetrics;
  /** Analysis timestamp */
  timestamp?: number;
  /** Files analyzed count */
  filesAnalyzed?: number;
}

export interface HealthMetrics {
  /** Code quality score (0-100) */
  codeQuality: number;
  /** Documentation coverage score (0-100) */
  documentationCoverage: number;
  /** Architecture consistency score (0-100) */
  architectureConsistency: number;
  /** Test coverage score (0-100) */
  testCoverage: number;
  /** Dependency health score (0-100) */
  dependencyHealth: number;
  /** Security score (0-100) */
  securityScore: number;
}

export interface FileAnalysis {
  /** File path */
  filePath: string;
  /** File type */
  fileType: 'typescript' | 'javascript' | 'markdown' | 'json' | 'other';
  /** Lines of code */
  linesOfCode: number;
  /** Has documentation */
  hasDocumentation: boolean;
  /** Has tests */
  hasTests: boolean;
  /** Complexity score */
  complexityScore: number;
  /** Issues found */
  issues: string[];
}

/**
 * Truth Calculator for analyzing codebase health and generating truth matrices
 * 
 * Provides comprehensive analysis of code quality, documentation, architecture,
 * and overall project health through configurable metrics and scoring algorithms.
 */
export class HaruspexTruthCalculator {
  private readonly defaultWeights = {
    codeQuality: 0.25,
    documentationCoverage: 0.20,
    architectureConsistency: 0.20,
    testCoverage: 0.15,
    dependencyHealth: 0.10,
    securityScore: 0.10
  };

  /**
   * Calculate current truth matrix for the workspace
   * 
   * @param workspaceRoot - Root directory of the workspace to analyze
   * @param customWeights - Optional custom weights for health metrics
   * @returns Promise resolving to calculated truth matrix
   */
  async calculateCurrentTruth(
    workspaceRoot: string,
    customWeights?: Partial<typeof this.defaultWeights>
  ): Promise<TruthMatrix> {
    const startTime = Date.now();
    const weights = { ...this.defaultWeights, ...customWeights };
    const validationErrors: string[] = [];

    try {
      // Validate workspace
      const workspaceStats = await this.validateWorkspace(workspaceRoot);
      if (!workspaceStats.isValid) {
        validationErrors.push(...workspaceStats.errors);
      }

      // Analyze files in workspace
      const fileAnalyses = await this.analyzeWorkspaceFiles(workspaceRoot);
      
      // Calculate health metrics
      const healthMetrics = await this.calculateHealthMetrics(fileAnalyses, workspaceRoot);
      
      // Calculate overall score using weighted average
      const overallHealthScore = this.calculateWeightedScore(healthMetrics, weights);
      
      // Add additional validation for edge cases
      if (fileAnalyses.length === 0) {
        validationErrors.push('No analyzable files found in workspace');
      }
      
      if (overallHealthScore < 20) {
        validationErrors.push('CRITICAL: Overall health score is extremely low');
      }

      const result: TruthMatrix = {
        overallHealthScore: Math.round(overallHealthScore),
        healthMetrics,
        timestamp: Date.now(),
        filesAnalyzed: fileAnalyses.length
      };

      if (validationErrors.length > 0) {
        result.validationErrors = validationErrors;
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      validationErrors.push(`Truth calculation failed: ${errorMessage}`);
      
      return {
        overallHealthScore: 0,
        validationErrors,
        timestamp: Date.now(),
        filesAnalyzed: 0
      };
    }
  }

  /**
   * Analyze specific file for truth calculation
   * 
   * @param filePath - Path to file to analyze
   * @returns Promise resolving to file analysis
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileType = this.determineFileType(filePath);
      const linesOfCode = content.split('\\n').length;
      
      const analysis: FileAnalysis = {
        filePath,
        fileType,
        linesOfCode,
        hasDocumentation: this.checkDocumentation(content, fileType),
        hasTests: this.checkTestFile(filePath),
        complexityScore: this.calculateComplexityScore(content, fileType),
        issues: []
      };

      // Add file-specific validations
      if (fileType === 'typescript' || fileType === 'javascript') {
        if (linesOfCode > 500) {
          analysis.issues.push('File is very large (>500 lines)');
        }
        if (!analysis.hasDocumentation && linesOfCode > 50) {
          analysis.issues.push('Large file lacks documentation');
        }
      }

      return analysis;
    } catch (error) {
      return {
        filePath,
        fileType: 'other',
        linesOfCode: 0,
        hasDocumentation: false,
        hasTests: false,
        complexityScore: 0,
        issues: [`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get truth trend analysis over time
   * 
   * @param workspaceRoot - Workspace root directory
   * @param previousResults - Previous truth calculations for trending
   * @returns Truth trend analysis
   */
  async getTruthTrend(
    workspaceRoot: string,
    previousResults: TruthMatrix[]
  ): Promise<{
    currentScore: number;
    trend: 'improving' | 'declining' | 'stable';
    changePercentage: number;
    recommendations: string[];
  }> {
    const current = await this.calculateCurrentTruth(workspaceRoot);
    
    if (previousResults.length === 0) {
      return {
        currentScore: current.overallHealthScore,
        trend: 'stable',
        changePercentage: 0,
        recommendations: ['Establish baseline for future trend analysis']
      };
    }

    const lastResult = previousResults[previousResults.length - 1];
    const changePercentage = ((current.overallHealthScore - lastResult.overallHealthScore) / lastResult.overallHealthScore) * 100;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (changePercentage > 5) trend = 'improving';
    else if (changePercentage < -5) trend = 'declining';
    
    const recommendations = this.generateTrendRecommendations(current, trend, changePercentage);
    
    return {
      currentScore: current.overallHealthScore,
      trend,
      changePercentage: Math.round(changePercentage * 100) / 100,
      recommendations
    };
  }

  private async validateWorkspace(workspaceRoot: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const stats = await fs.stat(workspaceRoot);
      if (!stats.isDirectory()) {
        errors.push('Workspace root is not a directory');
      }
    } catch (error) {
      errors.push(`Cannot access workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async analyzeWorkspaceFiles(workspaceRoot: string): Promise<FileAnalysis[]> {
    const analyses: FileAnalysis[] = [];
    
    try {
      const files = await this.findAnalyzableFiles(workspaceRoot);
      
      // Analyze files in parallel but limit concurrency
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(file => this.analyzeFile(file))
        );
        analyses.push(...batchResults);
      }
    } catch (error) {
      // Return empty array if file discovery fails
      console.warn('Failed to discover files:', error);
    }

    return analyses;
  }

  private async findAnalyzableFiles(workspaceRoot: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.md', '.json'];
    
    const scanDirectory = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and other irrelevant directories
            if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
        console.warn(`Skipping directory ${dirPath}:`, error);
      }
    };

    await scanDirectory(workspaceRoot);
    return files;
  }

  private async calculateHealthMetrics(analyses: FileAnalysis[], workspaceRoot: string): Promise<HealthMetrics> {
    if (analyses.length === 0) {
      return {
        codeQuality: 0,
        documentationCoverage: 0,
        architectureConsistency: 0,
        testCoverage: 0,
        dependencyHealth: 0,
        securityScore: 0
      };
    }

    const codeFiles = analyses.filter(a => a.fileType === 'typescript' || a.fileType === 'javascript');
    const docFiles = analyses.filter(a => a.fileType === 'markdown');
    
    // Calculate code quality (average complexity score)
    const codeQuality = codeFiles.length > 0 
      ? codeFiles.reduce((sum, file) => sum + file.complexityScore, 0) / codeFiles.length
      : 50;

    // Calculate documentation coverage
    const documentsWithDocs = analyses.filter(a => a.hasDocumentation).length;
    const documentationCoverage = analyses.length > 0 
      ? (documentsWithDocs / analyses.length) * 100
      : 0;

    // Calculate architecture consistency (placeholder - would analyze patterns)
    const architectureConsistency = await this.calculateArchitectureScore(workspaceRoot);

    // Calculate test coverage
    const filesWithTests = analyses.filter(a => a.hasTests).length;
    const testCoverage = codeFiles.length > 0 
      ? (filesWithTests / codeFiles.length) * 100
      : 0;

    // Calculate dependency health (placeholder - would analyze package.json)
    const dependencyHealth = await this.calculateDependencyHealth(workspaceRoot);

    // Calculate security score (placeholder - would run security analysis)
    const securityScore = 75; // Default reasonable score

    return {
      codeQuality: Math.round(codeQuality),
      documentationCoverage: Math.round(documentationCoverage),
      architectureConsistency: Math.round(architectureConsistency),
      testCoverage: Math.round(testCoverage),
      dependencyHealth: Math.round(dependencyHealth),
      securityScore: Math.round(securityScore)
    };
  }

  private determineFileType(filePath: string): FileAnalysis['fileType'] {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.md':
        return 'markdown';
      case '.json':
        return 'json';
      default:
        return 'other';
    }
  }

  private checkDocumentation(content: string, fileType: FileAnalysis['fileType']): boolean {
    if (fileType === 'markdown') return true;
    
    // Check for JSDoc comments, README references, or significant comments
    const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
    const hasComments = (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length > 5;
    
    return hasJSDoc || hasComments;
  }

  private checkTestFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(fileName) ||
           fileName.includes('test') ||
           fileName.includes('spec');
  }

  private calculateComplexityScore(content: string, fileType: FileAnalysis['fileType']): number {
    if (fileType !== 'typescript' && fileType !== 'javascript') {
      return 100; // Non-code files are not complex
    }

    // Simple complexity calculation based on control structures
    const lines = content.split('\\n');
    let complexity = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Count control structures
      if (/^(if|for|while|switch|catch|else if)[\s(]/.test(trimmed)) {
        complexity += 1;
      }
      // Count nested functions
      if (/function[\s(]/.test(trimmed) || /=>\s*{/.test(trimmed)) {
        complexity += 0.5;
      }
    }

    // Convert to 0-100 score (lower complexity = higher score)
    const linesOfCode = lines.length;
    const complexityRatio = linesOfCode > 0 ? complexity / linesOfCode : 0;
    return Math.max(0, Math.min(100, 100 - (complexityRatio * 200)));
  }

  private calculateWeightedScore(metrics: HealthMetrics, weights: typeof this.defaultWeights): number {
    return (
      metrics.codeQuality * weights.codeQuality +
      metrics.documentationCoverage * weights.documentationCoverage +
      metrics.architectureConsistency * weights.architectureConsistency +
      metrics.testCoverage * weights.testCoverage +
      metrics.dependencyHealth * weights.dependencyHealth +
      metrics.securityScore * weights.securityScore
    );
  }

  private async calculateArchitectureScore(workspaceRoot: string): Promise<number> {
    // Placeholder for architecture consistency analysis
    // Would analyze file organization, naming conventions, etc.
    try {
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      await fs.access(packageJsonPath);
      return 80; // Has package.json, reasonable structure
    } catch {
      return 60; // No clear structure indicators
    }
  }

  private async calculateDependencyHealth(workspaceRoot: string): Promise<number> {
    // Placeholder for dependency analysis
    // Would check for outdated packages, security vulnerabilities, etc.
    try {
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
      
      // Simple heuristic: moderate number of dependencies is good
      const totalDeps = depCount + devDepCount;
      if (totalDeps > 100) return 60; // Too many dependencies
      if (totalDeps < 5) return 70;   // Very few dependencies
      return 85; // Reasonable number of dependencies
    } catch {
      return 50; // No package.json or parsing failed
    }
  }

  private generateTrendRecommendations(
    current: TruthMatrix,
    trend: 'improving' | 'declining' | 'stable',
    changePercentage: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (trend === 'declining') {
      recommendations.push('Consider code review and refactoring efforts');
      if (current.healthMetrics?.testCoverage && current.healthMetrics.testCoverage < 70) {
        recommendations.push('Increase test coverage to improve stability');
      }
      if (current.healthMetrics?.documentationCoverage && current.healthMetrics.documentationCoverage < 60) {
        recommendations.push('Improve documentation coverage');
      }
    } else if (trend === 'stable' && current.overallHealthScore < 80) {
      recommendations.push('Consider implementing quality improvement initiatives');
      recommendations.push('Focus on areas with lowest health scores');
    } else if (trend === 'improving') {
      recommendations.push('Maintain current quality practices');
      recommendations.push('Consider sharing successful practices with team');
    }
    
    return recommendations;
  }
}