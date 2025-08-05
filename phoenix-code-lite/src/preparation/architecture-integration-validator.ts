/**
 * Architecture Integration Validator
 * 
 * Validates existing architecture for QMS integration
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ComponentAnalysis {
  totalComponents: number;
  components: Array<{
    name: string;
    filePath: string;
    dependencies: string[];
    usedBy: string[];
    qmsRelevance: 'preserve' | 'adapt' | 'replace' | 'remove';
    integrationRisk: 'low' | 'medium' | 'high';
  }>;
}

export interface ExtensionPatternValidation {
  valid: boolean;
  supportedPatterns: string[];
  recommendations: string[];
}

export interface BackwardCompatibilityAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  risks: string[];
  mitigationStrategies: string[];
  testingRequirements: string[];
}

export class ArchitectureIntegrationValidator {
  
  /**
   * Analyze components for QMS integration
   */
  async analyzeComponents(): Promise<ComponentAnalysis> {
    const components = await this.scanComponents('src/');
    
    return {
      totalComponents: components.length,
      components: components.map(comp => ({
        name: comp.name,
        filePath: comp.filePath,
        dependencies: comp.dependencies,
        usedBy: comp.usedBy,
        qmsRelevance: this.assessQMSRelevance(comp),
        integrationRisk: this.assessIntegrationRisk(comp)
      }))
    };
  }
  
  /**
   * Scan components in directory
   */
  private async scanComponents(dir: string): Promise<any[]> {
    const components: any[] = [];
    
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          const subComponents = await this.scanComponents(filePath);
          components.push(...subComponents);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          // Analyze TypeScript/JavaScript files
          const component = await this.analyzeFile(filePath);
          if (component) {
            components.push(component);
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dir}:`, error);
    }
    
    return components;
  }
  
  /**
   * Analyze individual file for component information
   */
  private async analyzeFile(filePath: string): Promise<any> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      // Simple analysis - in a real implementation, this would be more sophisticated
      const dependencies = this.extractDependencies(content);
      const usedBy: string[] = []; // Would be populated by reverse dependency analysis
      
      return {
        name: fileName,
        filePath,
        dependencies,
        usedBy
      };
    } catch (error) {
      console.warn(`Error analyzing file ${filePath}:`, error);
      return null;
    }
  }
  
  /**
   * Extract dependencies from file content
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Simple regex to find import statements
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    return dependencies;
  }
  
  /**
   * Assess QMS relevance of component
   */
  private assessQMSRelevance(component: any): 'preserve' | 'adapt' | 'replace' | 'remove' {
    const qmsRelevantComponents = [
      'TDDOrchestrator', 'ConfigManager', 'AuditLogger', 
      'ClaudeCodeClient', 'QualityGates', 'Foundation'
    ];
    
    if (qmsRelevantComponents.includes(component.name)) {
      return 'adapt';
    }
    
    return 'preserve';
  }
  
  /**
   * Assess integration risk of component
   */
  private assessIntegrationRisk(component: any): 'low' | 'medium' | 'high' {
    const highRiskComponents = ['TDDOrchestrator', 'AuditLogger'];
    const mediumRiskComponents = ['ConfigManager', 'QualityGates'];
    
    if (highRiskComponents.includes(component.name)) {
      return 'high';
    }
    
    if (mediumRiskComponents.includes(component.name)) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Validate extension patterns
   */
  async validateExtensionPatterns(): Promise<ExtensionPatternValidation> {
    const patterns = ['composition', 'inheritance', 'decorator', 'adapter'];
    const validPatterns: string[] = [];
    const recommendations: string[] = [];
    
    // For now, assume all patterns are valid (simplified validation)
    validPatterns.push(...patterns);
    
    recommendations.push(
      'Use composition over inheritance for QMS components',
      'Implement adapter pattern for regulatory document processing',
      'Use decorator pattern for audit trail functionality',
      'Ensure backward compatibility when extending existing components'
    );
    
    return {
      valid: validPatterns.length > 0,
      supportedPatterns: validPatterns,
      recommendations
    };
  }
  
  /**
   * Assess backward compatibility
   */
  async assessBackwardCompatibility(): Promise<BackwardCompatibilityAssessment> {
    const risks = [
      'QMS integration may break existing CLI commands',
      'Configuration schema changes could affect existing setups',
      'New audit logging might impact performance',
      'Regulatory validation could slow down existing workflows'
    ];
    
    const mitigationStrategies = [
      'Implement QMS features as optional extensions',
      'Maintain backward compatibility in configuration schemas',
      'Use performance monitoring for audit logging',
      'Provide configuration options to disable QMS features'
    ];
    
    const testingRequirements = [
      'Test all existing CLI commands with QMS enabled',
      'Validate configuration migration paths',
      'Performance test with audit logging enabled',
      'Verify regulatory validation doesn\'t break existing workflows'
    ];
    
    // Assess risk level based on number of risks
    const riskLevel: 'low' | 'medium' | 'high' = risks.length > 3 ? 'high' : 
                                                   risks.length > 1 ? 'medium' : 'low';
    
    return {
      riskLevel,
      risks,
      mitigationStrategies,
      testingRequirements
    };
  }
  
  /**
   * Validate architecture for QMS integration
   */
  async validateForQMSIntegration(): Promise<{
    components: ComponentAnalysis;
    extensionPatterns: ExtensionPatternValidation;
    backwardCompatibility: BackwardCompatibilityAssessment;
    overallRisk: 'low' | 'medium' | 'high';
  }> {
    const analysis = await this.analyzeComponents();
    const extensionValidation = await this.validateExtensionPatterns();
    const compatibilityAssessment = await this.assessBackwardCompatibility();
    
    return {
      components: analysis,
      extensionPatterns: extensionValidation,
      backwardCompatibility: compatibilityAssessment,
      overallRisk: this.calculateOverallRisk(analysis, extensionValidation, compatibilityAssessment)
    };
  }
  
  /**
   * Calculate overall integration risk
   */
  private calculateOverallRisk(
    analysis: ComponentAnalysis,
    extensionValidation: ExtensionPatternValidation,
    compatibilityAssessment: BackwardCompatibilityAssessment
  ): 'low' | 'medium' | 'high' {
    const highRiskComponents = analysis.components.filter(c => c.integrationRisk === 'high').length;
    const hasValidExtensions = extensionValidation.valid;
    const compatibilityRisk = compatibilityAssessment.riskLevel;
    
    if (highRiskComponents > 2 || compatibilityRisk === 'high') {
      return 'high';
    }
    
    if (highRiskComponents > 0 || compatibilityRisk === 'medium' || !hasValidExtensions) {
      return 'medium';
    }
    
    return 'low';
  }
} 