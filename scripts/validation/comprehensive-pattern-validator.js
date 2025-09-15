#!/usr/bin/env node

/**
 * Comprehensive Pattern Validation System
 * 
 * Applies comprehensive quality validation with intelligence consolidation
 * across pattern files using confidence scoring methodology, consistency 
 * verification, and integration validation with adaptive recommendations.
 * 
 * @version 1.0.0
 * @date 2025-09-14
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive Pattern Validator
 */
class ComprehensivePatternValidator {
  constructor() {
    this.validationResults = [];
    this.consistencyIssues = [];
    this.integrationOpportunities = [];
    this.optimizationRecommendations = [];
    this.confidenceScores = new Map();
    this.patterns = [];
  }

  /**
   * Main validation orchestration
   */
  async validatePatterns(patternFiles) {
    console.log('🔍 Starting Comprehensive Pattern Validation');
    console.log(`📊 Analyzing ${patternFiles.length} pattern files\n`);

    // Phase 1: Load and parse all patterns
    await this.loadPatterns(patternFiles);

    // Phase 2: Individual pattern validation with confidence scoring
    await this.validateIndividualPatterns();

    // Phase 3: Cross-pattern consistency verification
    await this.performConsistencyVerification();

    // Phase 4: Integration validation
    await this.performIntegrationValidation();

    // Phase 5: Intelligence consolidation
    await this.consolidateIntelligence();

    // Phase 6: Generate adaptive recommendations
    await this.generateAdaptiveRecommendations();

    // Generate comprehensive report
    return this.generateValidationReport();
  }

  /**
   * Load and parse pattern files
   */
  async loadPatterns(patternFiles) {
    console.log('📂 Loading pattern files...');
    
    for (const filePath of patternFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const pattern = this.parsePattern(filePath, content);
        this.patterns.push(pattern);
      } catch (error) {
        console.error(`❌ Failed to load ${filePath}: ${error.message}`);
      }
    }
    
    console.log(`✅ Loaded ${this.patterns.length} patterns successfully\n`);
  }

  /**
   * Parse individual pattern file
   */
  parsePattern(filePath, content) {
    const fileName = path.basename(filePath);
    const pattern = {
      filePath,
      fileName,
      content,
      frontmatter: null,
      structure: null,
      category: this.categorizePattern(fileName),
      size: content.length,
      lineCount: content.split('\n').length
    };

    // Extract frontmatter if present
    pattern.frontmatter = this.extractFrontmatter(content);
    
    // Analyze structure
    pattern.structure = this.analyzeStructure(content);
    
    return pattern;
  }

  /**
   * Categorize pattern by filename
   */
  categorizePattern(fileName) {
    if (fileName.includes('utility-pattern')) return 'utility';
    if (fileName.includes('intelligence-briefing-pattern')) return 'intelligence';
    if (fileName.includes('architectural') || fileName.includes('architecture')) return 'architecture';
    if (fileName.includes('integration')) return 'integration';
    if (fileName.includes('validation')) return 'validation';
    return 'general';
  }

  /**
   * Extract frontmatter from content
   */
  extractFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    try {
      const frontmatterText = frontmatterMatch[1];
      const frontmatter = {};
      
      // Simple YAML parser for basic frontmatter
      frontmatterText.split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
          frontmatter[match[1]] = match[2].trim();
        }
      });
      
      return frontmatter;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze pattern structure
   */
  analyzeStructure(content) {
    const structure = {
      headings: [],
      codeBlocks: 0,
      links: 0,
      taskTags: 0,
      confidenceIndicators: 0
    };

    // Extract headings
    const headingMatches = content.match(/^#+\s+(.+)$/gm);
    if (headingMatches) {
      structure.headings = headingMatches.map(h => h.trim());
    }

    // Count code blocks
    structure.codeBlocks = (content.match(/```/g) || []).length / 2;

    // Count links
    structure.links = (content.match(/\[.*?\]\(.*?\)/g) || []).length;

    // Count task tags
    structure.taskTags = (content.match(/TASK-[A-Z]+-\d+/g) || []).length;

    // Count confidence indicators
    structure.confidenceIndicators = (content.match(/confidence|certainty|probability/gi) || []).length;

    return structure;
  }

  /**
   * Validate individual patterns with confidence scoring
   */
  async validateIndividualPatterns() {
    console.log('🎯 Validating individual patterns with confidence scoring...');

    for (const pattern of this.patterns) {
      const validation = await this.validateSinglePattern(pattern);
      this.validationResults.push(validation);
      
      const confidence = this.calculateConfidenceScore(validation);
      this.confidenceScores.set(pattern.fileName, confidence);
      
      console.log(`  ${validation.status === 'PASS' ? '✅' : validation.status === 'WARN' ? '⚠️' : '❌'} ${pattern.fileName} (${confidence}% confidence)`);
    }
    
    console.log('');
  }

  /**
   * Validate single pattern
   */
  async validateSinglePattern(pattern) {
    const validation = {
      pattern: pattern.fileName,
      status: 'PASS',
      issues: [],
      strengths: [],
      metrics: {}
    };

    // Frontmatter validation
    if (!pattern.frontmatter) {
      validation.issues.push('Missing frontmatter');
      validation.status = 'WARN';
    } else if (pattern.frontmatter.error) {
      validation.issues.push(`Frontmatter parse error: ${pattern.frontmatter.error}`);
      validation.status = 'FAIL';
    } else {
      validation.strengths.push('Valid frontmatter present');
    }

    // Structure validation
    if (pattern.structure.headings.length === 0) {
      validation.issues.push('No headings found');
      validation.status = 'WARN';
    } else {
      validation.strengths.push(`${pattern.structure.headings.length} headings organized`);
    }

    // Content quality metrics
    validation.metrics = {
      contentLength: pattern.size,
      structuralComplexity: pattern.structure.headings.length + pattern.structure.codeBlocks,
      documentationRichness: pattern.structure.links + pattern.structure.codeBlocks,
      taskIntegration: pattern.structure.taskTags
    };

    // Category-specific validation
    await this.validateByCategory(pattern, validation);

    return validation;
  }

  /**
   * Category-specific validation
   */
  async validateByCategory(pattern, validation) {
    switch (pattern.category) {
      case 'utility':
        this.validateUtilityPattern(pattern, validation);
        break;
      case 'intelligence':
        this.validateIntelligencePattern(pattern, validation);
        break;
      case 'architecture':
        this.validateArchitecturePattern(pattern, validation);
        break;
      default:
        this.validateGeneralPattern(pattern, validation);
    }
  }

  /**
   * Validate utility patterns
   */
  validateUtilityPattern(pattern, validation) {
    // Check for implementation details
    if (pattern.content.includes('implementation') || pattern.content.includes('code')) {
      validation.strengths.push('Contains implementation guidance');
    } else {
      validation.issues.push('Missing implementation details');
    }

    // Check for usage examples
    if (pattern.structure.codeBlocks > 0) {
      validation.strengths.push('Contains code examples');
    } else {
      validation.issues.push('No code examples provided');
    }
  }

  /**
   * Validate intelligence briefing patterns
   */
  validateIntelligencePattern(pattern, validation) {
    // Check for analysis depth
    if (pattern.content.includes('analysis') || pattern.content.includes('insight')) {
      validation.strengths.push('Contains analytical content');
    }

    // Check for actionable recommendations
    if (pattern.content.includes('recommendation') || pattern.content.includes('action')) {
      validation.strengths.push('Provides actionable recommendations');
    }
  }

  /**
   * Validate architecture patterns
   */
  validateArchitecturePattern(pattern, validation) {
    // Check for architectural concepts
    if (pattern.content.includes('architecture') || pattern.content.includes('design')) {
      validation.strengths.push('Contains architectural guidance');
    }

    // Check for system integration aspects
    if (pattern.content.includes('integration') || pattern.content.includes('system')) {
      validation.strengths.push('Addresses system integration');
    }
  }

  /**
   * Validate general patterns
   */
  validateGeneralPattern(pattern, validation) {
    // Basic content validation
    if (pattern.size < 500) {
      validation.issues.push('Content appears minimal');
    }
  }

  /**
   * Calculate confidence score
   */
  calculateConfidenceScore(validation) {
    let score = 100;
    
    // Deduct for issues
    validation.issues.forEach(issue => {
      if (issue.includes('error') || issue.includes('missing')) {
        score -= 20;
      } else {
        score -= 10;
      }
    });

    // Add for strengths
    validation.strengths.forEach(() => {
      score += 5;
    });

    // Factor in metrics
    if (validation.metrics.structuralComplexity > 5) score += 10;
    if (validation.metrics.documentationRichness > 3) score += 10;
    if (validation.metrics.taskIntegration > 0) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Perform consistency verification across patterns
   */
  async performConsistencyVerification() {
    console.log('🔄 Performing cross-pattern consistency verification...');

    // Group patterns by category
    const categoryGroups = this.patterns.reduce((groups, pattern) => {
      if (!groups[pattern.category]) groups[pattern.category] = [];
      groups[pattern.category].push(pattern);
      return groups;
    }, {});

    // Check consistency within categories
    for (const [category, patterns] of Object.entries(categoryGroups)) {
      await this.verifyCategoryConsistency(category, patterns);
    }

    // Check global consistency
    await this.verifyGlobalConsistency();

    console.log(`  Found ${this.consistencyIssues.length} consistency issues\n`);
  }

  /**
   * Verify consistency within a category
   */
  async verifyCategoryConsistency(category, patterns) {
    if (patterns.length < 2) return;

    // Check frontmatter consistency
    const frontmatterKeys = new Set();
    patterns.forEach(p => {
      if (p.frontmatter && !p.frontmatter.error) {
        Object.keys(p.frontmatter).forEach(key => frontmatterKeys.add(key));
      }
    });

    // Check for missing frontmatter keys
    patterns.forEach(pattern => {
      if (pattern.frontmatter && !pattern.frontmatter.error) {
        frontmatterKeys.forEach(key => {
          if (!pattern.frontmatter[key]) {
            this.consistencyIssues.push({
              type: 'missing_frontmatter_key',
              category,
              pattern: pattern.fileName,
              issue: `Missing frontmatter key: ${key}`
            });
          }
        });
      }
    });

    // Check naming consistency
    const namingPatterns = patterns.map(p => p.fileName.split('-').slice(-2).join('-'));
    const uniqueNamingPatterns = [...new Set(namingPatterns)];
    if (uniqueNamingPatterns.length > 1) {
      this.consistencyIssues.push({
        type: 'inconsistent_naming',
        category,
        issue: `Inconsistent naming patterns in ${category}: ${uniqueNamingPatterns.join(', ')}`
      });
    }
  }

  /**
   * Verify global consistency across all patterns
   */
  async verifyGlobalConsistency() {
    // Check for duplicate content
    const contentHashes = new Map();
    this.patterns.forEach(pattern => {
      const contentHash = this.simpleHash(pattern.content);
      if (contentHashes.has(contentHash)) {
        this.consistencyIssues.push({
          type: 'duplicate_content',
          patterns: [contentHashes.get(contentHash), pattern.fileName],
          issue: 'Potential duplicate content detected'
        });
      } else {
        contentHashes.set(contentHash, pattern.fileName);
      }
    });
  }

  /**
   * Simple content hashing for duplicate detection
   */
  simpleHash(content) {
    // Remove whitespace and normalize for comparison
    return content.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  /**
   * Perform integration validation
   */
  async performIntegrationValidation() {
    console.log('🔗 Performing integration validation...');

    // Identify cross-references
    await this.identifyCrossReferences();

    // Find integration opportunities
    await this.findIntegrationOpportunities();

    // Validate integration completeness
    await this.validateIntegrationCompleteness();

    console.log(`  Identified ${this.integrationOpportunities.length} integration opportunities\n`);
  }

  /**
   * Identify cross-references between patterns
   */
  async identifyCrossReferences() {
    const references = new Map();

    this.patterns.forEach(pattern => {
      const refs = [];
      
      // Find references to other patterns
      this.patterns.forEach(otherPattern => {
        if (pattern !== otherPattern) {
          const baseName = otherPattern.fileName.replace(/\.md$/, '');
          if (pattern.content.includes(baseName) || 
              pattern.content.includes(otherPattern.fileName)) {
            refs.push(otherPattern.fileName);
          }
        }
      });
      
      if (refs.length > 0) {
        references.set(pattern.fileName, refs);
      }
    });

    // Store cross-reference analysis
    this.crossReferences = references;
  }

  /**
   * Find integration opportunities
   */
  async findIntegrationOpportunities() {
    // Group similar patterns
    const utilityPatterns = this.patterns.filter(p => p.category === 'utility');
    const intelligencePatterns = this.patterns.filter(p => p.category === 'intelligence');

    // Suggest utility consolidation
    if (utilityPatterns.length > 3) {
      this.integrationOpportunities.push({
        type: 'utility_consolidation',
        patterns: utilityPatterns.map(p => p.fileName),
        recommendation: 'Consider creating a unified utility pattern library'
      });
    }

    // Suggest intelligence briefing consolidation
    if (intelligencePatterns.length > 1) {
      this.integrationOpportunities.push({
        type: 'intelligence_consolidation',
        patterns: intelligencePatterns.map(p => p.fileName),
        recommendation: 'Consider creating a comprehensive intelligence briefing document'
      });
    }

    // Find patterns with similar content themes
    await this.findThematicOverlaps();
  }

  /**
   * Find thematic overlaps between patterns
   */
  async findThematicOverlaps() {
    const keywords = ['validation', 'implementation', 'architecture', 'utils', 'config'];
    
    keywords.forEach(keyword => {
      const matchingPatterns = this.patterns.filter(p => 
        p.content.toLowerCase().includes(keyword) || 
        p.fileName.toLowerCase().includes(keyword)
      );
      
      if (matchingPatterns.length > 2) {
        this.integrationOpportunities.push({
          type: 'thematic_overlap',
          theme: keyword,
          patterns: matchingPatterns.map(p => p.fileName),
          recommendation: `Consider consolidating ${keyword}-related patterns`
        });
      }
    });
  }

  /**
   * Validate integration completeness
   */
  async validateIntegrationCompleteness() {
    // Check for orphaned patterns (no references to/from others)
    const orphanedPatterns = this.patterns.filter(pattern => {
      const hasIncoming = Array.from(this.crossReferences.values()).some(refs => 
        refs.includes(pattern.fileName)
      );
      const hasOutgoing = this.crossReferences.has(pattern.fileName);
      
      return !hasIncoming && !hasOutgoing;
    });

    if (orphanedPatterns.length > 0) {
      this.integrationOpportunities.push({
        type: 'orphaned_patterns',
        patterns: orphanedPatterns.map(p => p.fileName),
        recommendation: 'Consider adding cross-references to improve pattern integration'
      });
    }
  }

  /**
   * Consolidate intelligence findings
   */
  async consolidateIntelligence() {
    console.log('🧠 Consolidating intelligence findings...');

    const intelligence = {
      totalPatterns: this.patterns.length,
      categoryDistribution: this.getCategoryDistribution(),
      qualityMetrics: this.calculateQualityMetrics(),
      integrationMaps: this.buildIntegrationMaps(),
      riskAssessment: this.assessRisks(),
      complianceStatus: this.checkCompliance()
    };

    this.intelligence = intelligence;
    console.log('  Intelligence consolidation completed\n');
  }

  /**
   * Get category distribution
   */
  getCategoryDistribution() {
    const distribution = {};
    this.patterns.forEach(pattern => {
      distribution[pattern.category] = (distribution[pattern.category] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Calculate quality metrics
   */
  calculateQualityMetrics() {
    const scores = Array.from(this.confidenceScores.values());
    const avgConfidence = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      averageConfidence: Math.round(avgConfidence),
      highConfidenceCount: scores.filter(s => s >= 80).length,
      lowConfidenceCount: scores.filter(s => s < 60).length,
      passRate: this.validationResults.filter(r => r.status === 'PASS').length / this.validationResults.length
    };
  }

  /**
   * Build integration maps
   */
  buildIntegrationMaps() {
    return {
      crossReferences: this.crossReferences,
      integrationOpportunities: this.integrationOpportunities.length,
      orphanedPatterns: this.integrationOpportunities
        .filter(o => o.type === 'orphaned_patterns')
        .flatMap(o => o.patterns)
    };
  }

  /**
   * Assess risks
   */
  assessRisks() {
    const risks = [];
    
    // Quality risks
    const qualityMetrics = this.calculateQualityMetrics();
    if (qualityMetrics.lowConfidenceCount > 0) {
      risks.push({
        type: 'quality_risk',
        severity: 'medium',
        description: `${qualityMetrics.lowConfidenceCount} patterns have low confidence scores`
      });
    }

    // Consistency risks
    if (this.consistencyIssues.length > 0) {
      risks.push({
        type: 'consistency_risk',
        severity: 'medium',
        description: `${this.consistencyIssues.length} consistency issues identified`
      });
    }

    return risks;
  }

  /**
   * Check compliance
   */
  checkCompliance() {
    const totalPatterns = this.patterns.length;
    const patternsWithFrontmatter = this.patterns.filter(p => p.frontmatter && !p.frontmatter.error).length;
    const complianceRate = patternsWithFrontmatter / totalPatterns;
    
    return {
      frontmatterCompliance: Math.round(complianceRate * 100),
      structuralCompliance: this.validationResults.filter(r => r.status !== 'FAIL').length / totalPatterns * 100,
      overallCompliance: complianceRate > 0.8 ? 'high' : complianceRate > 0.6 ? 'medium' : 'low'
    };
  }

  /**
   * Generate adaptive recommendations
   */
  async generateAdaptiveRecommendations() {
    console.log('💡 Generating adaptive optimization recommendations...');

    const recommendations = [];

    // Quality improvements
    if (this.intelligence.qualityMetrics.averageConfidence < 75) {
      recommendations.push({
        priority: 'high',
        category: 'quality',
        action: 'Improve pattern quality',
        details: 'Focus on patterns with confidence scores below 60%'
      });
    }

    // Consistency improvements
    if (this.consistencyIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'consistency',
        action: 'Address consistency issues',
        details: `Resolve ${this.consistencyIssues.length} identified consistency problems`
      });
    }

    // Integration optimizations
    if (this.integrationOpportunities.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'integration',
        action: 'Optimize pattern integration',
        details: `Implement ${this.integrationOpportunities.length} integration opportunities`
      });
    }

    // Compliance improvements
    if (this.intelligence.complianceStatus.overallCompliance !== 'high') {
      recommendations.push({
        priority: 'high',
        category: 'compliance',
        action: 'Improve pattern compliance',
        details: 'Add missing frontmatter and fix structural issues'
      });
    }

    this.optimizationRecommendations = recommendations;
    console.log(`  Generated ${recommendations.length} optimization recommendations\n`);
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPatterns: this.patterns.length,
        validationStatus: this.determineOverallStatus(),
        averageConfidence: this.intelligence.qualityMetrics.averageConfidence,
        complianceRate: this.intelligence.complianceStatus.overallCompliance
      },
      patternValidation: this.validationResults,
      confidenceScores: Object.fromEntries(this.confidenceScores),
      consistencyAnalysis: {
        issues: this.consistencyIssues,
        issueCount: this.consistencyIssues.length
      },
      integrationAnalysis: {
        opportunities: this.integrationOpportunities,
        crossReferences: Object.fromEntries(this.crossReferences)
      },
      intelligence: this.intelligence,
      recommendations: this.optimizationRecommendations
    };

    return report;
  }

  /**
   * Determine overall validation status
   */
  determineOverallStatus() {
    const failCount = this.validationResults.filter(r => r.status === 'FAIL').length;
    const warnCount = this.validationResults.filter(r => r.status === 'WARN').length;
    
    if (failCount > 0) return 'FAILED';
    if (warnCount > this.patterns.length * 0.3) return 'WARNINGS';
    return 'PASSED';
  }
}

/**
 * CLI execution
 */
async function main() {
  const patternFiles = [
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/service-utils-utility-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/debug-utils-utility-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/cross-project-dev/config-utils-intelligence-briefing-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/registry-utils-utility-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/cache-utils-utility-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/cross-project-dev/performance-utils-intelligence-briefing-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/terminal-formatter-utility-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/type-guards-utility-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/architecture/pattern-redundancy.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/architecture/pattern-usage-analysis.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/pattern-index.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/fixes/2025-09-11-1239-TASK-PATTERN-001-pattern-frontmatter-standardization.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/.claude/chains/workflow-feedback/2025-09-11-1341-pattern-frontmatter.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/minimal-compilation-stabilization-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns/vscode-extension-activation-pattern.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/validation/dev/validation-patterns.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Haruspex/dev/haruspex-patterns.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/prompts/documentation/maintenance/pattern-consolidation.md',
    '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/fixes/2025-08-23-1358-session-management-pcl-pattern.md'
  ];

  try {
    const validator = new ComprehensivePatternValidator();
    const report = await validator.validatePatterns(patternFiles);
    
    // Output summary
    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Status: ${report.summary.validationStatus}`);
    console.log(`Total Patterns: ${report.summary.totalPatterns}`);
    console.log(`Average Confidence: ${report.summary.averageConfidence}%`);
    console.log(`Compliance Rate: ${report.summary.complianceRate}`);
    console.log(`Consistency Issues: ${report.consistencyAnalysis.issueCount}`);
    console.log(`Integration Opportunities: ${report.integrationAnalysis.opportunities.length}`);
    console.log(`Recommendations: ${report.recommendations.length}`);
    
    // Save detailed report
    const reportPath = path.join(__dirname, '../validation-reports/comprehensive-pattern-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
    process.exit(report.summary.validationStatus === 'PASSED' ? 0 : 1);
    
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ComprehensivePatternValidator;