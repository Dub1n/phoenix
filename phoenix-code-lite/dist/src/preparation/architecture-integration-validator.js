"use strict";
/**
 * Architecture Integration Validator
 *
 * Validates existing architecture for QMS integration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectureIntegrationValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ArchitectureIntegrationValidator {
    /**
     * Analyze components for QMS integration
     */
    async analyzeComponents() {
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
    async scanComponents(dir) {
        const components = [];
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    // Recursively scan subdirectories
                    const subComponents = await this.scanComponents(filePath);
                    components.push(...subComponents);
                }
                else if (file.endsWith('.ts') || file.endsWith('.js')) {
                    // Analyze TypeScript/JavaScript files
                    const component = await this.analyzeFile(filePath);
                    if (component) {
                        components.push(component);
                    }
                }
            }
        }
        catch (error) {
            console.warn(`Error scanning directory ${dir}:`, error);
        }
        return components;
    }
    /**
     * Analyze individual file for component information
     */
    async analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath, path.extname(filePath));
            // Simple analysis - in a real implementation, this would be more sophisticated
            const dependencies = this.extractDependencies(content);
            const usedBy = []; // Would be populated by reverse dependency analysis
            return {
                name: fileName,
                filePath,
                dependencies,
                usedBy
            };
        }
        catch (error) {
            console.warn(`Error analyzing file ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Extract dependencies from file content
     */
    extractDependencies(content) {
        const dependencies = [];
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
    assessQMSRelevance(component) {
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
    assessIntegrationRisk(component) {
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
    async validateExtensionPatterns() {
        const patterns = ['composition', 'inheritance', 'decorator', 'adapter'];
        const validPatterns = [];
        const recommendations = [];
        // For now, assume all patterns are valid (simplified validation)
        validPatterns.push(...patterns);
        recommendations.push('Use composition over inheritance for QMS components', 'Implement adapter pattern for regulatory document processing', 'Use decorator pattern for audit trail functionality', 'Ensure backward compatibility when extending existing components');
        return {
            valid: validPatterns.length > 0,
            supportedPatterns: validPatterns,
            recommendations
        };
    }
    /**
     * Assess backward compatibility
     */
    async assessBackwardCompatibility() {
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
        const riskLevel = risks.length > 3 ? 'high' :
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
    async validateForQMSIntegration() {
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
    calculateOverallRisk(analysis, extensionValidation, compatibilityAssessment) {
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
exports.ArchitectureIntegrationValidator = ArchitectureIntegrationValidator;
//# sourceMappingURL=architecture-integration-validator.js.map