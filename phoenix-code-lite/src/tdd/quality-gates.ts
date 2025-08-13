/**---
 * title: [Quality Gates - TDD Validation Module]
 * tags: [TDD, Validation, Quality-Assurance, Scoring]
 * provides: [QualityGateManager Class, QualityGate Types, Quality Reports, Heuristic Validators]
 * requires: [Zod, Workflow Types]
 * description: [Runs syntax, coverage, code quality, and documentation checks to produce weighted quality scores and recommendations across TDD phases.]
 * ---*/

import { PhaseResult, TaskContext } from '../types/workflow';
import { z } from 'zod';

export interface QualityGate {
  name: string;
  description: string;
  validator: (artifact: any, context?: TaskContext) => Promise<QualityResult>;
  required: boolean;
  weight: number; // For scoring
}

export interface QualityResult {
  passed: boolean;
  score: number; // 0-1
  issues: string[];
  suggestions: string[];
  metadata?: Record<string, any>;
}

export interface QualityGateReport {
  phase: string;
  overallScore: number;
  overallQualityScore: number; // Added for compatibility
  overallPassed: boolean;
  gateResults: Record<string, QualityResult>;
  recommendations: string[];
}

export class QualityGateManager {
  private gates: QualityGate[] = [
    {
      name: 'syntax-validation',
      description: 'Validate code syntax and basic structure',
      validator: this.validateSyntax.bind(this),
      required: true,
      weight: 1.0,
    },
    {
      name: 'test-coverage',
      description: 'Ensure adequate test coverage',
      validator: this.validateTestCoverage.bind(this),
      required: true,
      weight: 0.8,
    },
    {
      name: 'code-quality',
      description: 'Check code quality metrics',
      validator: this.validateCodeQuality.bind(this),
      required: false,
      weight: 0.6,
    },
    {
      name: 'documentation',
      description: 'Verify documentation completeness',
      validator: this.validateDocumentation.bind(this),
      required: false,
      weight: 0.4,
    },
  ];
  
  async runQualityGates(
    artifact: any, 
    context: TaskContext, 
    phase: string
  ): Promise<QualityGateReport> {
    const results: Record<string, QualityResult> = {};
    let overallScore = 0;
    let totalWeight = 0;
    let allRequiredPassed = true;
    
    for (const gate of this.gates) {
      try {
        const result = await gate.validator(artifact, context);
        results[gate.name] = result;
        
        overallScore += result.score * gate.weight;
        totalWeight += gate.weight;
        
        if (gate.required && !result.passed) {
          allRequiredPassed = false;
        }
        
      } catch (error) {
        results[gate.name] = {
          passed: false,
          score: 0,
          issues: [`Quality gate error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          suggestions: ['Check artifact structure and try again'],
        };
        
        if (gate.required) {
          allRequiredPassed = false;
        }
      }
    }
    
    const finalScore = totalWeight > 0 ? overallScore / totalWeight : 0;
    return {
      phase,
      overallScore: finalScore,
      overallQualityScore: finalScore, // Added for compatibility
      overallPassed: allRequiredPassed,
      gateResults: results,
      recommendations: this.generateRecommendations(results),
    };
  }
  
  private async validateSyntax(artifact: any, context?: TaskContext): Promise<QualityResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let validFiles = 0;
    
    if (!artifact || !artifact.files || !Array.isArray(artifact.files)) {
      issues.push('Invalid artifact structure - no files array found');
      return { passed: false, score: 0, issues, suggestions };
    }
    
    for (const file of artifact.files) {
      try {
        if (!file.path || !file.content) {
          issues.push(`Invalid file structure: ${file.path || 'unknown'}`);
          continue;
        }
        
        if (file.content.trim().length === 0) {
          issues.push(`Empty file: ${file.path}`);
        } else if (!this.hasValidStructure(file.content, context?.language)) {
          issues.push(`Invalid structure in: ${file.path}`);
          suggestions.push(`Review ${context?.language || 'code'} syntax in ${file.path}`);
        } else {
          validFiles++;
        }
      } catch (error) {
        issues.push(`Syntax error in ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    const score = artifact.files.length > 0 ? validFiles / artifact.files.length : 0;
    
    return {
      passed: issues.length === 0,
      score,
      issues,
      suggestions,
      metadata: { validFiles, totalFiles: artifact.files.length },
    };
  }
  
  private async validateTestCoverage(artifact: any, context?: TaskContext): Promise<QualityResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    const testFiles = artifact.testFiles ? artifact.testFiles.length : 0;
    const implementationFiles = artifact.files ? artifact.files.length : 0;
    
    if (testFiles === 0) {
      issues.push('No test files found');
      suggestions.push('Create test files for your implementation');
    }
    
    if (implementationFiles > 0 && testFiles / implementationFiles < 0.5) {
      issues.push('Low test-to-implementation ratio');
      suggestions.push('Consider adding more comprehensive tests');
    }
    
    const score = implementationFiles > 0 ? 
      Math.min(1.0, testFiles / implementationFiles) : 
      (testFiles > 0 ? 1.0 : 0.0);
    
    return {
      passed: issues.length === 0,
      score,
      issues,
      suggestions,
      metadata: { testFiles, implementationFiles },
    };
  }
  
  private async validateCodeQuality(artifact: any, context?: TaskContext): Promise<QualityResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let qualityScore = 1.0;
    
    if (!artifact.files) {
      return { passed: false, score: 0, issues: ['No files to analyze'], suggestions: [] };
    }
    
    for (const file of artifact.files) {
      // Simple heuristic-based quality checks
      const lines = file.content.split('\n');
      const codeLines = lines.filter((line: string) => line.trim() && !line.trim().startsWith('//'));
      
      // Check for excessively long functions
      const functionBlocks = this.findFunctionBlocks(file.content);
      const longFunctions = functionBlocks.filter(fn => fn.lines > 50);
      
      if (longFunctions.length > 0) {
        issues.push(`${file.path}: Contains ${longFunctions.length} long functions (>50 lines)`);
        suggestions.push(`Consider breaking down large functions in ${file.path}`);
        qualityScore *= 0.9;
      }
      
      // Check for missing error handling
      if (codeLines.length > 10 && !file.content.includes('try') && !file.content.includes('catch')) {
        issues.push(`${file.path}: Missing error handling`);
        suggestions.push(`Add appropriate error handling to ${file.path}`);
        qualityScore *= 0.95;
      }
    }
    
    return {
      passed: issues.length === 0,
      score: qualityScore,
      issues,
      suggestions,
    };
  }
  
  private async validateDocumentation(artifact: any, context?: TaskContext): Promise<QualityResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let docScore = 1.0;
    
    if (!artifact.files) {
      return { passed: false, score: 0, issues: ['No files to analyze'], suggestions: [] };
    }
    
    for (const file of artifact.files) {
      const hasComments = file.content.includes('//') || file.content.includes('/*');
      const hasDocstrings = file.content.includes('/**') || file.content.includes('"""');
      
      if (!hasComments && !hasDocstrings) {
        issues.push(`${file.path}: No documentation found`);
        suggestions.push(`Add comments and documentation to ${file.path}`);
        docScore *= 0.8;
      }
    }
    
    return {
      passed: issues.length === 0,
      score: docScore,
      issues,
      suggestions,
    };
  }
  
  private hasValidStructure(content: string, language?: string): boolean {
    if (!content || content.trim().length === 0) return false;
    
    // Basic structure validation based on language
    switch (language?.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return !content.includes('SyntaxError') && this.hasBalancedBraces(content);
      case 'python':
        return !content.includes('IndentationError') && !content.includes('SyntaxError');
      default:
        return this.hasBalancedBraces(content);
    }
  }
  
  private hasBalancedBraces(content: string): boolean {
    let braces = 0;
    let brackets = 0;
    let parens = 0;
    
    for (const char of content) {
      switch (char) {
        case '{': braces++; break;
        case '}': braces--; break;
        case '[': brackets++; break;
        case ']': brackets--; break;
        case '(': parens++; break;
        case ')': parens--; break;
      }
    }
    
    return braces === 0 && brackets === 0 && parens === 0;
  }
  
  private findFunctionBlocks(content: string): Array<{name: string, lines: number}> {
    const functions: Array<{name: string, lines: number}> = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('function ') || line.includes(' => ') || line.match(/^\s*(async\s+)?function/)) {
        const functionStart = i;
        let braceCount = 0;
        let functionEnd = i;
        
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          braceCount += (currentLine.match(/\{/g) || []).length;
          braceCount -= (currentLine.match(/\}/g) || []).length;
          
          if (braceCount === 0 && j > i) {
            functionEnd = j;
            break;
          }
        }
        
        functions.push({
          name: line.substring(0, 50) + '...',
          lines: functionEnd - functionStart + 1
        });
      }
    }
    
    return functions;
  }
  
  private generateRecommendations(results: Record<string, QualityResult>): string[] {
    const recommendations: string[] = [];
    
    Object.entries(results).forEach(([gateName, result]) => {
      if (!result.passed && result.suggestions.length > 0) {
        recommendations.push(`${gateName}: ${result.suggestions.join(', ')}`);
      }
    });
    
    return recommendations;
  }
}
