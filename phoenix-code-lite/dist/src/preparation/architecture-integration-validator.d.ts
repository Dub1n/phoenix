/**
 * Architecture Integration Validator
 *
 * Validates existing architecture for QMS integration
 */
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
export declare class ArchitectureIntegrationValidator {
    /**
     * Analyze components for QMS integration
     */
    analyzeComponents(): Promise<ComponentAnalysis>;
    /**
     * Scan components in directory
     */
    private scanComponents;
    /**
     * Analyze individual file for component information
     */
    private analyzeFile;
    /**
     * Extract dependencies from file content
     */
    private extractDependencies;
    /**
     * Assess QMS relevance of component
     */
    private assessQMSRelevance;
    /**
     * Assess integration risk of component
     */
    private assessIntegrationRisk;
    /**
     * Validate extension patterns
     */
    validateExtensionPatterns(): Promise<ExtensionPatternValidation>;
    /**
     * Assess backward compatibility
     */
    assessBackwardCompatibility(): Promise<BackwardCompatibilityAssessment>;
    /**
     * Validate architecture for QMS integration
     */
    validateForQMSIntegration(): Promise<{
        components: ComponentAnalysis;
        extensionPatterns: ExtensionPatternValidation;
        backwardCompatibility: BackwardCompatibilityAssessment;
        overallRisk: 'low' | 'medium' | 'high';
    }>;
    /**
     * Calculate overall integration risk
     */
    private calculateOverallRisk;
}
//# sourceMappingURL=architecture-integration-validator.d.ts.map