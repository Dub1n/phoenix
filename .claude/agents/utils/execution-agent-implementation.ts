/**
 * Execution Agent Implementation
 * Main execution logic with interface conversion layer
 * 
 * Created conversion layer between general HandoffInput/HandoffOutput and ExecutionAgent-specific interfaces
 * Uses adapter pattern with conversion methods for flexibility vs direct inheritance complexity
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
    ExecutionCapabilities, 
    ExecutionContext, 
    ExecutionResults, 
    ScriptValidationResult,
    DocumentationUpdate,
    QualityGatesStatus,
    QualityGatesCriteria
} from './execution-capabilities.js';
import { HandoffInput, HandoffOutput } from '../interfaces/handoff-types.js';

// ExecutionAgent-specific handoff interfaces
export interface ExecutionHandoffInput {
    executionId: string;
    taskDescription: string;
    projectPath: string;
    executionParameters: ExecutionParameters;
    context: {
        taskId: string;
        previousResults?: any;
        requirements: string[];
        constraints: string[];
    };
}

export interface ExecutionParameters {
    validationScripts: string[];
    testSuites: string[];
    documentationTargets: string[];
    qualityGatesCriteria: QualityGatesCriteria;
    executionTimeout: number; // 600 seconds max
    enableRollback: boolean;
    evidenceRequirements: string[];
}

export interface ExecutionHandoffOutput {
    agentType: "ExecutionAgent";
    executionId: string;
    status: "success" | "partial" | "failed" | "retry";
    confidence: number;
    executionTime: number;
    results: ExecutionResults;
    recommendations: string[];
    auditTrail: Array<{
        timestamp: string;
        action: string;
        result: string;
        filesAffected: string[];
        errorDetails?: string;
    }>;
    metadata: {
        contextTokensUsed: number;
        resourcesAccessed: string[];
        executionEnvironment: string;
        rollbackPointsCreated: number;
    };
}

/**
 * Main ExecutionAgent Implementation Class
 */
export class ExecutionAgentImplementation {
    private capabilities: ExecutionCapabilities;
    private startTime!: number; // Definite assignment assertion - will be set in executeTask
    private contextTokensUsed: number = 0;
    private resourcesAccessed: string[] = [];

    constructor() {
        // Initialize with a default context - will be properly set in setupExecutionContext
        const defaultContext: ExecutionContext = {
            taskId: '',
            projectPath: '',
            validationScripts: [],
            testSuites: [],
            documentationTargets: [],
            qualityGatesCriteria: {
                minimumSuccessRate: 0.90,
                requiredEvidenceTypes: [],
                documentationCompleteness: true,
                crossReferenceValidation: true
            },
            rollbackPoints: []
        };
        this.capabilities = new ExecutionCapabilities(defaultContext);
    }

    /**
     * Execute validation, testing, and documentation tasks
     */
    async executeTask(input: HandoffInput): Promise<HandoffOutput> {
        this.startTime = Date.now();
        
        // Convert general HandoffInput to ExecutionHandoffInput
        const executionInput = this.convertToExecutionInput(input);
        
        try {
            // Phase 1: Setup and validation
            const executionContext = await this.setupExecutionContext(executionInput);
            this.capabilities = new ExecutionCapabilities(executionContext);
            
            // Phase 2: Core execution
            const validationResults = await this.executeValidationPhase();
            const documentationUpdates = await this.executeDocumentationPhase();
            
            // Phase 3: Quality validation and finalization
            const qualityGatesStatus = await this.capabilities.validateQualityGates(validationResults);
            const executionResults = this.capabilities.generateExecutionResults(
                validationResults,
                documentationUpdates,
                qualityGatesStatus
            );

            // Phase 4: Generate final output
            const executionOutput = await this.generateExecutionHandoffOutput(executionInput, executionResults, qualityGatesStatus);
            return this.convertToHandoffOutput(executionOutput);

        } catch (error) {
            const executionErrorOutput = await this.handleExecutionError(executionInput, error);
            return this.convertToHandoffOutput(executionErrorOutput);
        }
    }

    /**
     * Convert general HandoffInput to ExecutionHandoffInput
     */
    private convertToExecutionInput(input: HandoffInput): ExecutionHandoffInput {
        return {
            executionId: `exec-${Date.now()}`,
            taskDescription: input.context.task_description,
            projectPath: input.project,
            executionParameters: {
                validationScripts: [],
                testSuites: [],
                documentationTargets: [],
                qualityGatesCriteria: {
                    minimumSuccessRate: 0.90,
                    requiredEvidenceTypes: [],
                    documentationCompleteness: true,
                    crossReferenceValidation: true
                },
                executionTimeout: input.execution_parameters.max_execution_time || 600000,
                enableRollback: true,
                evidenceRequirements: []
            },
            context: {
                taskId: input.task_id,
                previousResults: input.context.previous_results,
                requirements: input.context.requirements,
                constraints: input.context.constraints
            }
        };
    }

    /**
     * Convert ExecutionHandoffOutput to general HandoffOutput
     */
    private convertToHandoffOutput(executionOutput: ExecutionHandoffOutput): HandoffOutput {
        return {
            task_id: executionOutput.executionId,
            status: executionOutput.status,
            confidence: executionOutput.confidence === 1 ? "high" : executionOutput.confidence > 0.7 ? "medium" : "low",
            execution_time_ms: executionOutput.executionTime * 1000, // Convert seconds to milliseconds
            results: {
                primary_data: executionOutput.results,
                summary: `ExecutionAgent completed with ${executionOutput.status} status`,
                recommendations: executionOutput.recommendations || [],
                evidence_files: executionOutput.auditTrail?.map(entry => entry.filesAffected).flat() || []
            },
            next_action: executionOutput.status === 'success' ? 'continue' : executionOutput.status === 'retry' ? 'manual_intervention' : 'fallback',
            metadata: {
                files_accessed: executionOutput.metadata.resourcesAccessed || [],
                tools_used: ["ExecutionAgent", "ValidationScripts", "TestSuites"],
                token_usage_estimate: executionOutput.metadata.contextTokensUsed || 0
            }
        };
    }

    /**
     * Setup execution context from handoff input
     */
    private async setupExecutionContext(input: ExecutionHandoffInput): Promise<ExecutionContext> {
        const context: ExecutionContext = {
            taskId: input.context.taskId,
            projectPath: input.projectPath,
            validationScripts: input.executionParameters.validationScripts,
            testSuites: input.executionParameters.testSuites,
            documentationTargets: input.executionParameters.documentationTargets,
            qualityGatesCriteria: input.executionParameters.qualityGatesCriteria,
            rollbackPoints: []
        };

        // Validate that all required files exist
        await this.validateExecutionEnvironment(context);
        
        // Track resources accessed
        this.resourcesAccessed.push(input.projectPath);
        this.resourcesAccessed.push(...context.validationScripts);
        this.resourcesAccessed.push(...context.testSuites);
        this.resourcesAccessed.push(...context.documentationTargets);

        return context;
    }

    /**
     * Execute validation phase
     */
    private async executeValidationPhase(): Promise<ScriptValidationResult[]> {
        const validationResults: ScriptValidationResult[] = [];

        // Execute validation scripts
        const scriptResults = await this.capabilities.executeValidationScripts();
        validationResults.push(...scriptResults);

        // Execute test suites
        const testResults = await this.capabilities.executeTestSuites();
        validationResults.push(...testResults);

        // Create rollback point after validation
        await this.capabilities.createRollbackPoint('post-validation', 'Validation phase completed');

        return validationResults;
    }

    /**
     * Execute documentation phase
     */
    private async executeDocumentationPhase(): Promise<DocumentationUpdate[]> {
        // Update pattern documentation
        const documentationUpdates = await this.capabilities.updatePatternDocumentation();

        // Create rollback point after documentation
        await this.capabilities.createRollbackPoint('post-documentation', 'Documentation phase completed');

        return documentationUpdates;
    }

    /**
     * Generate final handoff output
     */
    private async generateExecutionHandoffOutput(
        input: ExecutionHandoffInput,
        executionResults: ExecutionResults,
        qualityGatesStatus: QualityGatesStatus
    ): Promise<ExecutionHandoffOutput> {
        const executionTime = (Date.now() - this.startTime) / 1000; // Convert to seconds
        
        return {
            agentType: "ExecutionAgent",
            executionId: input.executionId,
            status: executionResults.overallStatus,
            confidence: executionResults.confidence,
            executionTime,
            results: executionResults,
            recommendations: [
                ...executionResults.recommendations,
                ...this.generatePerformanceRecommendations(executionTime, qualityGatesStatus)
            ],
            auditTrail: executionResults.auditTrail,
            metadata: {
                contextTokensUsed: this.contextTokensUsed,
                resourcesAccessed: this.resourcesAccessed,
                executionEnvironment: process.platform,
                rollbackPointsCreated: executionResults.auditTrail.filter(entry => entry.action === 'rollback-point').length
            }
        };
    }

    /**
     * Handle execution errors
     */
    private async handleExecutionError(input: ExecutionHandoffInput, error: unknown): Promise<ExecutionHandoffOutput> {
        const executionTime = (Date.now() - this.startTime) / 1000;
        const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';

        return {
            agentType: "ExecutionAgent",
            executionId: input.executionId,
            status: "failed",
            confidence: 0,
            executionTime,
            results: {
                overallStatus: 'failed',
                confidence: 0,
                validationResults: [],
                documentationUpdates: [],
                qualityGatesStatus: {
                    validationSuccess: false,
                    evidenceComplete: false,
                    documentationIntegrity: false,
                    rollbackCapable: false,
                    successRate: 0
                },
                evidence: {
                    validationLogs: [],
                    testOutputs: [],
                    documentationChanges: [],
                    auditTrails: []
                },
                recommendations: [
                    `Fix execution error: ${errorMessage}`,
                    'Review task parameters and environment setup',
                    'Check file permissions and resource availability'
                ],
                auditTrail: [{
                    timestamp: new Date().toISOString(),
                    action: 'execution-error',
                    result: `Failed with error: ${errorMessage}`,
                    filesAffected: [],
                    errorDetails: errorMessage
                }]
            },
            recommendations: [
                `Critical error occurred: ${errorMessage}`,
                'Manual intervention required to resolve execution failure',
                'Review logs and attempt rollback if necessary'
            ],
            auditTrail: [{
                timestamp: new Date().toISOString(),
                action: 'execution-error',
                result: `Failed with error: ${errorMessage}`,
                filesAffected: [],
                errorDetails: errorMessage
            }],
            metadata: {
                contextTokensUsed: this.contextTokensUsed,
                resourcesAccessed: this.resourcesAccessed,
                executionEnvironment: process.platform,
                rollbackPointsCreated: 0
            }
        };
    }

    /**
     * Validate execution environment
     */
    private async validateExecutionEnvironment(context: ExecutionContext): Promise<void> {
        // Check project path exists
        if (!fs.existsSync(context.projectPath)) {
            throw new Error(`Project path does not exist: ${context.projectPath}`);
        }

        // Check validation scripts exist
        for (const script of context.validationScripts) {
            const scriptPath = path.resolve(context.projectPath, script);
            if (!fs.existsSync(scriptPath)) {
                throw new Error(`Validation script not found: ${scriptPath}`);
            }
        }

        // Check test suites are accessible
        for (const testSuite of context.testSuites) {
            // Validate test suite accessibility (implementation depends on test framework)
            this.contextTokensUsed += 100; // Track context usage for validation
        }

        // Check documentation targets
        for (const docTarget of context.documentationTargets) {
            const docPath = path.resolve(context.projectPath, docTarget);
            // Documentation files might not exist yet, but their directories should
            const docDir = path.dirname(docPath);
            if (!fs.existsSync(docDir)) {
                throw new Error(`Documentation directory does not exist: ${docDir}`);
            }
        }
    }

    /**
     * Generate performance-based recommendations
     */
    private generatePerformanceRecommendations(executionTime: number, qualityGates: QualityGatesStatus): string[] {
        const recommendations: string[] = [];

        // Execution time recommendations
        if (executionTime > 480) { // 8 minutes (80% of 10-minute target)
            recommendations.push('Execution time approaching limit - consider optimizing validation scripts');
        }

        // Quality gates recommendations
        if (qualityGates.successRate < 0.95) {
            recommendations.push(`Success rate (${Math.round(qualityGates.successRate * 100)}%) below optimal - review failing validations`);
        }

        if (!qualityGates.evidenceComplete) {
            recommendations.push('Evidence collection incomplete - ensure all required evidence types are captured');
        }

        if (!qualityGates.rollbackCapable) {
            recommendations.push('Rollback capability not established - ensure proper state management');
        }

        return recommendations;
    }

    /**
     * Static factory method for creating ExecutionAgent instances
     */
    static async createExecutionAgent(handoffInputPath: string, handoffOutputPath: string): Promise<void> {
        try {
            // Read input from handoff file
            const inputData = fs.readFileSync(handoffInputPath, 'utf8');
            const handoffInput: HandoffInput = JSON.parse(inputData);

            // Execute task
            const executionAgent = new ExecutionAgentImplementation();
            const result = await executionAgent.executeTask(handoffInput);

            // Write result to handoff output
            fs.writeFileSync(handoffOutputPath, JSON.stringify(result, null, 2));

        } catch (error) {
            // Write error result to handoff output
            const errorResult: HandoffOutput = {
                task_id: "error-" + Date.now(),
                status: "failed",
                confidence: "low",
                execution_time_ms: 0,
                results: {
                    primary_data: null,
                    summary: `ExecutionAgent initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    recommendations: [`Critical initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                    evidence_files: []
                },
                next_action: 'fallback',
                metadata: {
                    files_accessed: [],
                    tools_used: ["ExecutionAgent"],
                    token_usage_estimate: 0
                }
            };

            fs.writeFileSync(handoffOutputPath, JSON.stringify(errorResult, null, 2));
        }
    }
}

// Export default function for CLI usage
export default ExecutionAgentImplementation;

// Main ExecutionAgent implementation orchestrating validation, testing, documentation, and quality gates with file-based handoff
// Uses orchestrated execution pipeline vs simple linear execution for comprehensive functionality