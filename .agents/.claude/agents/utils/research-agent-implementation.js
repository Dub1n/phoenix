"use strict";
/**
 * Research Agent Main Implementation
 *
 * Complete implementation for TASK-SUBAGENT-002 Generic Research Agent
 * Includes error handling, output generation, and main execution logic
 *
 * @created 2025-09-05
 * @source TASK-SUBAGENT-002 Generic Research Agent Implementation
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
exports.runResearchAgent = runResearchAgent;
const research_capabilities_1 = require("./research-capabilities");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Main ResearchAgent execution function
 */
async function runResearchAgent(inputFilepath, outputFilepath, taskDescription) {
    const startTime = Date.now();
    let input;
    let results;
    try {
        // Step 1: Validate input JSON format and required fields
        input = await validateInput(inputFilepath);
        // Step 2: Execute research according to task description parameters
        results = await (0, research_capabilities_1.executeResearch)(input);
        // Step 3: Consolidate findings into structured output format
        const output = await generateOutput(input.task_id, results, Date.now() - startTime);
        // Step 4: Write results to output filepath in standard JSON format
        await writeOutput(outputFilepath, output);
        // Step 5: Return success status
        return 'success';
    }
    catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        return await handleError(normalizedError, inputFilepath, outputFilepath, startTime);
    }
}
/**
 * Validate input JSON format and required fields
 */
async function validateInput(filepath) {
    try {
        // Check if file exists and is readable
        await fs.access(filepath, fs.constants.R_OK);
        // Read and parse JSON
        const raw = await fs.readFile(filepath, 'utf8');
        if (!raw.trim()) {
            throw new HandoffValidationError('Input file is empty');
        }
        let input;
        try {
            input = JSON.parse(raw);
        }
        catch (parseError) {
            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
            throw new HandoffValidationError(`Invalid JSON format: ${errorMessage}`);
        }
        // Validate required fields
        validateRequiredFields(input);
        return input;
    }
    catch (error) {
        if (error instanceof HandoffValidationError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new HandoffValidationError(`Failed to read input file: ${errorMessage}`);
    }
}
/**
 * Validate required fields in input JSON
 */
function validateRequiredFields(input) {
    const requiredFields = [
        'project',
        'task_id',
        'workflow_phase',
        'context',
        'execution_parameters'
    ];
    const missingFields = requiredFields.filter(field => !(field in input));
    if (missingFields.length > 0) {
        throw new HandoffValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
    // Validate context object
    if (!input.context || typeof input.context !== 'object') {
        throw new HandoffValidationError('Context must be an object');
    }
    const requiredContextFields = ['task_description', 'requirements'];
    const missingContextFields = requiredContextFields.filter(field => !(field in input.context));
    if (missingContextFields.length > 0) {
        throw new HandoffValidationError(`Missing context fields: ${missingContextFields.join(', ')}`);
    }
    // Validate execution parameters
    if (!input.execution_parameters || typeof input.execution_parameters !== 'object') {
        throw new HandoffValidationError('Execution parameters must be an object');
    }
    if (typeof input.execution_parameters.max_execution_time !== 'number') {
        throw new HandoffValidationError('Max execution time must be a number');
    }
}
/**
 * Generate structured output from research results
 */
async function generateOutput(taskId, researchResults, executionTime) {
    const confidence = determineConfidence(researchResults);
    const nextAction = determineNextAction(researchResults, confidence);
    return {
        task_id: taskId,
        status: 'success',
        confidence: confidence,
        execution_time_ms: executionTime,
        results: {
            primary_data: researchResults,
            summary: generateSummary(researchResults),
            recommendations: extractRecommendations(researchResults),
            evidence_files: [] // No additional evidence files created in research phase
        },
        next_action: nextAction,
        metadata: {
            files_accessed: getFilesAccessed(researchResults),
            tools_used: ['Read', 'Grep', 'Glob'],
            token_usage_estimate: estimateTokenUsage(researchResults)
        }
    };
}
/**
 * Determine confidence level based on research results
 */
function determineConfidence(results) {
    let confidenceScore = 0;
    // Pattern match quality
    if (results.patterns_found.length > 0) {
        const topMatch = results.patterns_found[0];
        if (topMatch.relevance_score >= 80)
            confidenceScore += 40;
        else if (topMatch.relevance_score >= 60)
            confidenceScore += 30;
        else if (topMatch.relevance_score >= 40)
            confidenceScore += 20;
        else
            confidenceScore += 10;
    }
    // Complexity assessment clarity
    if (results.complexity_assessment.score <= 5) {
        confidenceScore += 30; // Lower complexity = higher confidence
    }
    else if (results.complexity_assessment.score <= 7) {
        confidenceScore += 20;
    }
    else {
        confidenceScore += 10;
    }
    // Dependency analysis completeness
    const totalDeps = results.dependencies.file_dependencies.length +
        results.dependencies.pattern_dependencies.length +
        results.dependencies.external_dependencies.length;
    if (totalDeps === 0) {
        confidenceScore += 30; // No dependencies = simpler
    }
    else {
        const availableDeps = results.dependencies.file_dependencies.filter(d => d.status === 'available').length +
            results.dependencies.pattern_dependencies.filter(d => d.status === 'documented').length +
            results.dependencies.external_dependencies.filter(d => d.status === 'available').length;
        const depRatio = availableDeps / totalDeps;
        confidenceScore += Math.round(depRatio * 30);
    }
    if (confidenceScore >= 80)
        return 'high';
    if (confidenceScore >= 50)
        return 'medium';
    return 'low';
}
/**
 * Determine next action based on research results and confidence
 */
function determineNextAction(results, confidence) {
    // Check for critical blockers
    const criticalBlockers = results.implementation_guidance.potential_blockers.filter(blocker => blocker.includes('Missing') || blocker.includes('unavailable'));
    if (criticalBlockers.length > 0) {
        return 'manual_intervention';
    }
    // Check complexity vs confidence
    if (results.complexity_assessment.score >= 8 && confidence === 'low') {
        return 'fallback';
    }
    // High risk factors with low confidence
    if (results.complexity_assessment.risk_factors.length >= 3 && confidence === 'low') {
        return 'fallback';
    }
    return 'continue';
}
/**
 * Generate human-readable summary of research results
 */
function generateSummary(results) {
    const patternCount = results.patterns_found.length;
    const topPattern = results.patterns_found[0];
    const complexity = results.complexity_assessment.score;
    const timeEstimate = results.complexity_assessment.estimated_time_hours;
    let summary = `Research completed in ${results.execution_time}ms. `;
    if (patternCount > 0) {
        summary += `Found ${patternCount} relevant patterns. `;
        summary += `Top match: ${topPattern.pattern_name} (${topPattern.relevance_score}% relevance). `;
    }
    else {
        summary += 'No specific patterns found - generic implementation approach recommended. ';
    }
    summary += `Task complexity: ${complexity}/10 (${timeEstimate}h estimated). `;
    const riskCount = results.complexity_assessment.risk_factors.length;
    if (riskCount > 0) {
        summary += `${riskCount} risk factors identified. `;
    }
    return summary;
}
/**
 * Extract actionable recommendations from research results
 */
function extractRecommendations(results) {
    const recommendations = [];
    // Pattern recommendations
    if (results.patterns_found.length > 0) {
        const topPattern = results.patterns_found[0];
        recommendations.push(`Follow ${topPattern.pattern_name} pattern for implementation guidance`);
        if (results.patterns_found.length > 1) {
            recommendations.push(`Consider alternative approaches: ${results.patterns_found.slice(1, 3).map(p => p.pattern_name).join(', ')}`);
        }
    }
    // Complexity recommendations
    if (results.complexity_assessment.score >= 7) {
        recommendations.push('High complexity detected - consider breaking into smaller tasks');
        recommendations.push(`Estimated ${results.complexity_assessment.estimated_time_hours}h implementation time`);
    }
    // Risk mitigation recommendations
    for (const risk of results.complexity_assessment.risk_factors) {
        recommendations.push(`Address risk: ${risk}`);
    }
    // Dependency recommendations
    const missingDeps = results.dependencies.file_dependencies.filter(d => d.status === 'missing');
    for (const dep of missingDeps) {
        recommendations.push(`Resolve missing dependency: ${dep.file_path}`);
    }
    // Implementation guidance
    recommendations.push(results.implementation_guidance.recommended_approach);
    return recommendations.slice(0, 10); // Limit to top 10 recommendations
}
/**
 * Get list of files accessed during research
 */
function getFilesAccessed(results) {
    const files = new Set();
    // Add pattern files
    for (const pattern of results.patterns_found) {
        files.add(pattern.file_path);
    }
    // Add dependency files
    for (const dep of results.dependencies.file_dependencies) {
        files.add(dep.file_path);
    }
    return Array.from(files);
}
/**
 * Estimate token usage for research execution
 */
function estimateTokenUsage(results) {
    let tokens = 1000; // Base research overhead
    // Add tokens for pattern analysis
    tokens += results.patterns_found.length * 200;
    // Add tokens for complexity analysis
    tokens += 300;
    // Add tokens for dependency analysis
    tokens += results.dependencies.file_dependencies.length * 100;
    tokens += results.dependencies.pattern_dependencies.length * 50;
    tokens += results.dependencies.external_dependencies.length * 50;
    return tokens;
}
/**
 * Write output JSON to file
 */
async function writeOutput(filepath, output) {
    try {
        // Ensure output directory exists
        const dir = path.dirname(filepath);
        await fs.mkdir(dir, { recursive: true });
        // Write formatted JSON
        const json = JSON.stringify(output, null, 2);
        await fs.writeFile(filepath, json, 'utf8');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new HandoffFileError(`Failed to write output file: ${errorMessage}`);
    }
}
/**
 * Handle errors and generate appropriate error output
 */
async function handleError(error, inputFilepath, outputFilepath, startTime) {
    const executionTime = Date.now() - startTime;
    let status = 'failed';
    let errorOutput;
    if (error instanceof HandoffValidationError) {
        // Input validation errors are unrecoverable
        status = 'failed';
        errorOutput = createErrorOutput('validation-error', error, executionTime);
    }
    else if (error instanceof HandoffTimeoutError) {
        // Timeout errors can be retried
        status = 'retry';
        errorOutput = createErrorOutput('timeout-error', error, executionTime);
    }
    else if (error instanceof HandoffFileError) {
        // File errors might be recoverable
        status = 'retry';
        errorOutput = createErrorOutput('file-error', error, executionTime);
    }
    else {
        // Unknown errors - try to provide partial results if available
        status = 'partial';
        errorOutput = createErrorOutput('unknown-error', error, executionTime);
    }
    try {
        await writeOutput(outputFilepath, errorOutput);
    }
    catch (writeError) {
        const errorMessage = writeError instanceof Error ? writeError.message : String(writeError);
        console.error('Failed to write error output:', errorMessage);
    }
    return status;
}
/**
 * Create error output structure
 */
function createErrorOutput(errorType, error, executionTime) {
    return {
        task_id: 'unknown',
        status: 'failed',
        confidence: 'low',
        execution_time_ms: executionTime,
        results: {
            primary_data: null,
            summary: `Research agent failed: ${error.message}`,
            recommendations: ['Review input parameters and retry', 'Check file permissions and paths'],
            evidence_files: []
        },
        next_action: 'fallback',
        errors: [{
                error_type: errorType,
                message: error.message,
                suggested_resolution: getResolutionSuggestion(errorType)
            }],
        metadata: {
            files_accessed: [],
            tools_used: ['Read'],
            token_usage_estimate: 100
        }
    };
}
/**
 * Get resolution suggestion based on error type
 */
function getResolutionSuggestion(errorType) {
    switch (errorType) {
        case 'validation-error':
            return 'Check input JSON format and ensure all required fields are present';
        case 'timeout-error':
            return 'Reduce research scope or increase timeout limit';
        case 'file-error':
            return 'Check file paths and permissions, ensure files exist and are readable';
        default:
            return 'Review error details and retry with corrected parameters';
    }
}
// Custom error classes
class HandoffValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HandoffValidationError';
    }
}
class HandoffTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HandoffTimeoutError';
    }
}
class HandoffFileError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HandoffFileError';
    }
}
