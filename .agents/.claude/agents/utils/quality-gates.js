/**
 * Quality Gates and Standards Module
 * TASK-SUBAGENT-004 Implementation - Comprehensive quality validation framework
 */
// Standard Quality Gates Configuration
export const STANDARD_QUALITY_GATES = {
    validation: {
        minimumSuccessRate: 0.90, // 90% minimum success rate
        requiredValidationTypes: ['syntax', 'type-check', 'lint', 'test'],
        timeoutThreshold: 300, // 5 minutes per validation
        retryAttempts: 3
    },
    evidence: {
        requiredEvidenceTypes: ['validation-logs', 'test-outputs', 'documentation-changes'],
        minimumEvidenceCount: 3,
        evidenceQualityThreshold: 0.8,
        auditTrailRequired: true
    },
    documentation: {
        completenessThreshold: 0.95, // 95% documentation completeness
        crossReferenceValidation: true,
        patternDocumentationRequired: true,
        backupRequired: true
    },
    rollback: {
        rollbackPointsRequired: 2, // At least 2 rollback points
        rollbackTestRequired: true,
        stateIntegrityValidation: true
    },
    performance: {
        maxExecutionTime: 600, // 10 minutes maximum
        maxContextTokens: 50000,
        resourceUtilizationThreshold: 0.8, // 80% max resource usage
        memoryUsageLimit: 512 // 512 MB
    }
};
/**
 * Quality Gates Validator Class
 */
export class QualityGatesValidator {
    constructor(config = STANDARD_QUALITY_GATES) {
        this.config = config;
        this.startTime = Date.now();
    }
    /**
     * Validate all quality gates
     */
    async validateAllGates(validationResults, evidenceCollection, documentationUpdates, rollbackPoints, executionMetrics) {
        const results = {
            overallPassed: false,
            overallScore: 0,
            gateResults: {
                validation: await this.validateValidationGate(validationResults),
                evidence: await this.validateEvidenceGate(evidenceCollection),
                documentation: await this.validateDocumentationGate(documentationUpdates),
                rollback: await this.validateRollbackGate(rollbackPoints),
                performance: await this.validatePerformanceGate(executionMetrics)
            },
            recommendations: [],
            warnings: [],
            criticalIssues: []
        };
        // Calculate overall score and determine pass/fail
        this.calculateOverallResults(results);
        return results;
    }
    /**
     * Validate validation gate requirements
     */
    async validateValidationGate(validationResults) {
        const gate = this.config.validation;
        const successfulValidations = validationResults.filter(r => r.status === 'success').length;
        const totalValidations = validationResults.length;
        const actualSuccessRate = totalValidations > 0 ? successfulValidations / totalValidations : 0;
        const result = {
            passed: actualSuccessRate >= gate.minimumSuccessRate,
            score: Math.round(actualSuccessRate * 100),
            details: [
                {
                    requirement: 'Minimum Success Rate',
                    actual: actualSuccessRate,
                    expected: gate.minimumSuccessRate,
                    status: actualSuccessRate >= gate.minimumSuccessRate ? 'pass' : 'fail'
                },
                {
                    requirement: 'Required Validation Types',
                    actual: this.getValidationTypes(validationResults).length,
                    expected: gate.requiredValidationTypes.length,
                    status: this.validateRequiredTypes(validationResults, gate.requiredValidationTypes) ? 'pass' : 'fail'
                }
            ],
            recommendations: []
        };
        // Add recommendations for failed validations
        if (!result.passed) {
            result.recommendations.push(`Improve validation success rate from ${Math.round(actualSuccessRate * 100)}% to ${Math.round(gate.minimumSuccessRate * 100)}%`);
            const failedValidations = validationResults.filter(r => r.status === 'failed');
            if (failedValidations.length > 0) {
                result.recommendations.push(`Address ${failedValidations.length} failed validation(s): ${failedValidations.map(v => v.scriptName).join(', ')}`);
            }
        }
        return result;
    }
    /**
     * Validate evidence collection gate requirements
     */
    async validateEvidenceGate(evidenceCollection) {
        const gate = this.config.evidence;
        const evidenceTypes = this.getEvidenceTypes(evidenceCollection);
        const evidenceCount = this.getTotalEvidenceCount(evidenceCollection);
        const result = {
            passed: evidenceTypes.length >= gate.requiredEvidenceTypes.length &&
                evidenceCount >= gate.minimumEvidenceCount,
            score: this.calculateEvidenceScore(evidenceCollection, gate),
            details: [
                {
                    requirement: 'Required Evidence Types',
                    actual: evidenceTypes.length,
                    expected: gate.requiredEvidenceTypes.length,
                    status: evidenceTypes.length >= gate.requiredEvidenceTypes.length ? 'pass' : 'fail'
                },
                {
                    requirement: 'Minimum Evidence Count',
                    actual: evidenceCount,
                    expected: gate.minimumEvidenceCount,
                    status: evidenceCount >= gate.minimumEvidenceCount ? 'pass' : 'fail'
                },
                {
                    requirement: 'Audit Trail Required',
                    actual: evidenceCollection.auditTrails?.length > 0,
                    expected: gate.auditTrailRequired,
                    status: (!gate.auditTrailRequired || evidenceCollection.auditTrails?.length > 0) ? 'pass' : 'fail'
                }
            ],
            recommendations: []
        };
        // Add evidence-specific recommendations
        if (!result.passed) {
            const missingTypes = gate.requiredEvidenceTypes.filter(type => !evidenceTypes.includes(type));
            if (missingTypes.length > 0) {
                result.recommendations.push(`Collect missing evidence types: ${missingTypes.join(', ')}`);
            }
            if (evidenceCount < gate.minimumEvidenceCount) {
                result.recommendations.push(`Increase evidence collection from ${evidenceCount} to ${gate.minimumEvidenceCount} items`);
            }
        }
        return result;
    }
    /**
     * Validate documentation gate requirements
     */
    async validateDocumentationGate(documentationUpdates) {
        const gate = this.config.documentation;
        const completeness = this.calculateDocumentationCompleteness(documentationUpdates);
        const crossReferencesValid = this.validateCrossReferences(documentationUpdates);
        const result = {
            passed: completeness >= gate.completenessThreshold &&
                (!gate.crossReferenceValidation || crossReferencesValid),
            score: Math.round(completeness * 100),
            details: [
                {
                    requirement: 'Documentation Completeness',
                    actual: completeness,
                    expected: gate.completenessThreshold,
                    status: completeness >= gate.completenessThreshold ? 'pass' : 'fail'
                },
                {
                    requirement: 'Cross Reference Validation',
                    actual: crossReferencesValid,
                    expected: gate.crossReferenceValidation,
                    status: (!gate.crossReferenceValidation || crossReferencesValid) ? 'pass' : 'fail'
                },
                {
                    requirement: 'Pattern Documentation',
                    actual: this.hasPatternDocumentation(documentationUpdates),
                    expected: gate.patternDocumentationRequired,
                    status: (!gate.patternDocumentationRequired || this.hasPatternDocumentation(documentationUpdates)) ? 'pass' : 'fail'
                }
            ],
            recommendations: []
        };
        // Add documentation recommendations
        if (!result.passed) {
            if (completeness < gate.completenessThreshold) {
                result.recommendations.push(`Improve documentation completeness from ${Math.round(completeness * 100)}% to ${Math.round(gate.completenessThreshold * 100)}%`);
            }
            if (gate.crossReferenceValidation && !crossReferencesValid) {
                result.recommendations.push('Fix cross-reference validation errors in documentation');
            }
        }
        return result;
    }
    /**
     * Validate rollback gate requirements
     */
    async validateRollbackGate(rollbackPoints) {
        const gate = this.config.rollback;
        const rollbackCount = rollbackPoints.length;
        const rollbackTestPassed = await this.testRollbackCapability(rollbackPoints);
        const result = {
            passed: rollbackCount >= gate.rollbackPointsRequired &&
                (!gate.rollbackTestRequired || rollbackTestPassed),
            score: this.calculateRollbackScore(rollbackPoints, rollbackTestPassed, gate),
            details: [
                {
                    requirement: 'Rollback Points Required',
                    actual: rollbackCount,
                    expected: gate.rollbackPointsRequired,
                    status: rollbackCount >= gate.rollbackPointsRequired ? 'pass' : 'fail'
                },
                {
                    requirement: 'Rollback Test Required',
                    actual: rollbackTestPassed,
                    expected: gate.rollbackTestRequired,
                    status: (!gate.rollbackTestRequired || rollbackTestPassed) ? 'pass' : 'fail'
                }
            ],
            recommendations: []
        };
        // Add rollback recommendations
        if (!result.passed) {
            if (rollbackCount < gate.rollbackPointsRequired) {
                result.recommendations.push(`Create ${gate.rollbackPointsRequired - rollbackCount} additional rollback point(s)`);
            }
            if (gate.rollbackTestRequired && !rollbackTestPassed) {
                result.recommendations.push('Fix rollback capability - test failed');
            }
        }
        return result;
    }
    /**
     * Validate performance gate requirements
     */
    async validatePerformanceGate(executionMetrics) {
        const gate = this.config.performance;
        const executionTime = (Date.now() - this.startTime) / 1000; // seconds
        const contextTokens = executionMetrics?.contextTokensUsed || 0;
        const memoryUsage = this.getMemoryUsage();
        const result = {
            passed: executionTime <= gate.maxExecutionTime &&
                contextTokens <= gate.maxContextTokens &&
                memoryUsage <= gate.memoryUsageLimit,
            score: this.calculatePerformanceScore(executionTime, contextTokens, memoryUsage, gate),
            details: [
                {
                    requirement: 'Max Execution Time',
                    actual: Math.round(executionTime),
                    expected: gate.maxExecutionTime,
                    status: executionTime <= gate.maxExecutionTime ? 'pass' : 'fail'
                },
                {
                    requirement: 'Max Context Tokens',
                    actual: contextTokens,
                    expected: gate.maxContextTokens,
                    status: contextTokens <= gate.maxContextTokens ? 'pass' : 'fail'
                },
                {
                    requirement: 'Memory Usage Limit',
                    actual: Math.round(memoryUsage),
                    expected: gate.memoryUsageLimit,
                    status: memoryUsage <= gate.memoryUsageLimit ? 'pass' : 'fail'
                }
            ],
            recommendations: []
        };
        // Add performance recommendations
        if (!result.passed) {
            if (executionTime > gate.maxExecutionTime) {
                result.recommendations.push(`Optimize execution time from ${Math.round(executionTime)}s to under ${gate.maxExecutionTime}s`);
            }
            if (contextTokens > gate.maxContextTokens) {
                result.recommendations.push(`Reduce context token usage from ${contextTokens} to under ${gate.maxContextTokens}`);
            }
            if (memoryUsage > gate.memoryUsageLimit) {
                result.recommendations.push(`Optimize memory usage from ${Math.round(memoryUsage)}MB to under ${gate.memoryUsageLimit}MB`);
            }
        }
        return result;
    }
    // Helper methods
    calculateOverallResults(results) {
        const gateScores = Object.values(results.gateResults).map(gate => gate.score);
        results.overallScore = Math.round(gateScores.reduce((sum, score) => sum + score, 0) / gateScores.length);
        const allGatesPassed = Object.values(results.gateResults).every(gate => gate.passed);
        results.overallPassed = allGatesPassed && results.overallScore >= 80; // 80% minimum overall score
        // Collect all recommendations
        Object.values(results.gateResults).forEach(gate => {
            results.recommendations.push(...gate.recommendations);
        });
        // Add overall recommendations
        if (!results.overallPassed) {
            results.recommendations.push('Address quality gate failures before finalizing execution');
            results.criticalIssues.push(`Overall quality score (${results.overallScore}%) below acceptable threshold`);
        }
    }
    getValidationTypes(validationResults) {
        const types = validationResults.map(r => r.type || 'unknown');
        return Array.from(new Set(types));
    }
    validateRequiredTypes(validationResults, requiredTypes) {
        const availableTypes = this.getValidationTypes(validationResults);
        return requiredTypes.every(type => availableTypes.includes(type));
    }
    getEvidenceTypes(evidenceCollection) {
        const types = [];
        if (evidenceCollection.validationLogs?.length > 0)
            types.push('validation-logs');
        if (evidenceCollection.testOutputs?.length > 0)
            types.push('test-outputs');
        if (evidenceCollection.documentationChanges?.length > 0)
            types.push('documentation-changes');
        if (evidenceCollection.auditTrails?.length > 0)
            types.push('audit-trails');
        return types;
    }
    getTotalEvidenceCount(evidenceCollection) {
        return (evidenceCollection.validationLogs?.length || 0) +
            (evidenceCollection.testOutputs?.length || 0) +
            (evidenceCollection.documentationChanges?.length || 0) +
            (evidenceCollection.auditTrails?.length || 0);
    }
    calculateEvidenceScore(evidenceCollection, gate) {
        const types = this.getEvidenceTypes(evidenceCollection);
        const count = this.getTotalEvidenceCount(evidenceCollection);
        const typeScore = (types.length / gate.requiredEvidenceTypes.length) * 50;
        const countScore = Math.min(count / gate.minimumEvidenceCount, 1) * 50;
        return Math.round(typeScore + countScore);
    }
    calculateDocumentationCompleteness(documentationUpdates) {
        if (documentationUpdates.length === 0)
            return 0;
        const validatedUpdates = documentationUpdates.filter(update => update.validated).length;
        return validatedUpdates / documentationUpdates.length;
    }
    validateCrossReferences(documentationUpdates) {
        return documentationUpdates.every(update => update.validated !== false);
    }
    hasPatternDocumentation(documentationUpdates) {
        return documentationUpdates.some(update => update.updateType === 'pattern');
    }
    async testRollbackCapability(rollbackPoints) {
        // Simplified rollback test - in production this would perform actual rollback testing
        return rollbackPoints.length > 0 && rollbackPoints.every(point => point.canRollback);
    }
    calculateRollbackScore(rollbackPoints, rollbackTestPassed, gate) {
        const pointScore = Math.min(rollbackPoints.length / gate.rollbackPointsRequired, 1) * 70;
        const testScore = rollbackTestPassed ? 30 : 0;
        return Math.round(pointScore + testScore);
    }
    calculatePerformanceScore(executionTime, contextTokens, memoryUsage, gate) {
        const timeScore = Math.max(0, (gate.maxExecutionTime - executionTime) / gate.maxExecutionTime) * 40;
        const tokenScore = Math.max(0, (gate.maxContextTokens - contextTokens) / gate.maxContextTokens) * 30;
        const memoryScore = Math.max(0, (gate.memoryUsageLimit - memoryUsage) / gate.memoryUsageLimit) * 30;
        return Math.round(timeScore + tokenScore + memoryScore);
    }
    getMemoryUsage() {
        // Get current memory usage in MB
        const usage = process.memoryUsage();
        return Math.round(usage.heapUsed / 1024 / 1024);
    }
}
/**
 * Create standard quality gates validator
 */
export function createQualityGatesValidator(config) {
    const fullConfig = config ? { ...STANDARD_QUALITY_GATES, ...config } : STANDARD_QUALITY_GATES;
    return new QualityGatesValidator(fullConfig);
}
/**
 * Quick quality gates validation
 */
export async function validateQualityGates(validationResults, evidenceCollection, documentationUpdates, rollbackPoints, executionMetrics, config) {
    const validator = createQualityGatesValidator(config);
    return await validator.validateAllGates(validationResults, evidenceCollection, documentationUpdates, rollbackPoints, executionMetrics);
}
// TODO: [TASK-SUBAGENT-004-004] Pattern: quality-gates-framework | Complexity: 6 | Dependencies: execution-capabilities,validation-framework
// Context: Comprehensive quality gates validation framework for ExecutionAgent with configurable standards and metrics
// Validation-Required: quality-gate-compliance, validation-accuracy, performance-monitoring
// Pattern-Info: { approach: "comprehensive-quality-framework", alternatives: "simple-pass-fail", trade-offs: "thorough-validation-vs-complexity" }
