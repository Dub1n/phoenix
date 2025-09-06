"use strict";
/**
 * JSON Schema Validation System
 *
 * Comprehensive validation utilities for handoff input/output data.
 * Provides type-safe validation with detailed error reporting.
 *
 * @created 2025-09-05
 * @source dev/auto/subagent-workflow-integration-design.md lines 236-281
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHandoffInput = validateHandoffInput;
exports.validateHandoffOutput = validateHandoffOutput;
exports.sanitizeHandoffInput = sanitizeHandoffInput;
exports.createValidationError = createValidationError;
const handoff_types_js_1 = require("../interfaces/handoff-types.js");
/**
 * Validate HandoffInput data structure
 *
 * @param data - Data to validate
 * @returns Validation result with typed data or errors
 */
function validateHandoffInput(data) {
    const errors = [];
    // Required fields validation
    if (typeof data !== 'object' || data === null) {
        errors.push({
            field: 'root',
            message: 'Input must be an object',
            expected: 'object',
            received: typeof data
        });
        return { success: false, errors };
    }
    // Validate project
    if (typeof data.project !== 'string') {
        errors.push({
            field: 'project',
            message: 'Project must be a string',
            expected: 'string',
            received: typeof data.project
        });
    }
    // Validate task_id
    if (typeof data.task_id !== 'string') {
        errors.push({
            field: 'task_id',
            message: 'Task ID must be a string',
            expected: 'string',
            received: typeof data.task_id
        });
    }
    // Validate workflow_phase
    const validPhases = ['research', 'execution', 'validation', 'documentation'];
    if (!validPhases.includes(data.workflow_phase)) {
        errors.push({
            field: 'workflow_phase',
            message: 'Invalid workflow phase',
            expected: validPhases.join(' | '),
            received: data.workflow_phase
        });
    }
    // Validate context object
    if (typeof data.context !== 'object' || data.context === null) {
        errors.push({
            field: 'context',
            message: 'Context must be an object',
            expected: 'object',
            received: typeof data.context
        });
    }
    else {
        // Validate context fields
        if (typeof data.context.task_description !== 'string') {
            errors.push({
                field: 'context.task_description',
                message: 'Task description must be a string',
                expected: 'string',
                received: typeof data.context.task_description
            });
        }
        if (!Array.isArray(data.context.requirements)) {
            errors.push({
                field: 'context.requirements',
                message: 'Requirements must be an array',
                expected: 'array',
                received: typeof data.context.requirements
            });
        }
        else if (!data.context.requirements.every((req) => typeof req === 'string')) {
            errors.push({
                field: 'context.requirements',
                message: 'All requirements must be strings',
                expected: 'string[]',
                received: 'mixed array'
            });
        }
        if (!Array.isArray(data.context.constraints)) {
            errors.push({
                field: 'context.constraints',
                message: 'Constraints must be an array',
                expected: 'array',
                received: typeof data.context.constraints
            });
        }
        else if (!data.context.constraints.every((constraint) => typeof constraint === 'string')) {
            errors.push({
                field: 'context.constraints',
                message: 'All constraints must be strings',
                expected: 'string[]',
                received: 'mixed array'
            });
        }
        // Optional fields validation
        if (data.context.relevant_files !== undefined) {
            if (!Array.isArray(data.context.relevant_files)) {
                errors.push({
                    field: 'context.relevant_files',
                    message: 'Relevant files must be an array',
                    expected: 'array',
                    received: typeof data.context.relevant_files
                });
            }
            else if (!data.context.relevant_files.every((file) => typeof file === 'string')) {
                errors.push({
                    field: 'context.relevant_files',
                    message: 'All file paths must be strings',
                    expected: 'string[]',
                    received: 'mixed array'
                });
            }
        }
    }
    // Validate execution_parameters
    if (typeof data.execution_parameters !== 'object' || data.execution_parameters === null) {
        errors.push({
            field: 'execution_parameters',
            message: 'Execution parameters must be an object',
            expected: 'object',
            received: typeof data.execution_parameters
        });
    }
    else {
        if (typeof data.execution_parameters.max_execution_time !== 'number') {
            errors.push({
                field: 'execution_parameters.max_execution_time',
                message: 'Max execution time must be a number',
                expected: 'number',
                received: typeof data.execution_parameters.max_execution_time
            });
        }
        const validConfidenceThresholds = ['high', 'medium', 'low'];
        if (!validConfidenceThresholds.includes(data.execution_parameters.confidence_threshold)) {
            errors.push({
                field: 'execution_parameters.confidence_threshold',
                message: 'Invalid confidence threshold',
                expected: validConfidenceThresholds.join(' | '),
                received: data.execution_parameters.confidence_threshold
            });
        }
        if (typeof data.execution_parameters.fallback_strategy !== 'string') {
            errors.push({
                field: 'execution_parameters.fallback_strategy',
                message: 'Fallback strategy must be a string',
                expected: 'string',
                received: typeof data.execution_parameters.fallback_strategy
            });
        }
    }
    if (errors.length > 0) {
        return { success: false, errors };
    }
    return { success: true, data: data, errors: [] };
}
/**
 * Validate HandoffOutput data structure
 *
 * @param data - Data to validate
 * @returns Validation result with typed data or errors
 */
function validateHandoffOutput(data) {
    const errors = [];
    // Required fields validation
    if (typeof data !== 'object' || data === null) {
        errors.push({
            field: 'root',
            message: 'Output must be an object',
            expected: 'object',
            received: typeof data
        });
        return { success: false, errors };
    }
    // Validate task_id
    if (typeof data.task_id !== 'string') {
        errors.push({
            field: 'task_id',
            message: 'Task ID must be a string',
            expected: 'string',
            received: typeof data.task_id
        });
    }
    // Validate status
    const validStatuses = ['success', 'partial', 'failed', 'retry'];
    if (!validStatuses.includes(data.status)) {
        errors.push({
            field: 'status',
            message: 'Invalid status',
            expected: validStatuses.join(' | '),
            received: data.status
        });
    }
    // Validate confidence
    const validConfidenceLevels = ['high', 'medium', 'low'];
    if (!validConfidenceLevels.includes(data.confidence)) {
        errors.push({
            field: 'confidence',
            message: 'Invalid confidence level',
            expected: validConfidenceLevels.join(' | '),
            received: data.confidence
        });
    }
    // Validate execution_time_ms
    if (typeof data.execution_time_ms !== 'number') {
        errors.push({
            field: 'execution_time_ms',
            message: 'Execution time must be a number',
            expected: 'number',
            received: typeof data.execution_time_ms
        });
    }
    // Validate results object
    if (typeof data.results !== 'object' || data.results === null) {
        errors.push({
            field: 'results',
            message: 'Results must be an object',
            expected: 'object',
            received: typeof data.results
        });
    }
    else {
        if (typeof data.results.summary !== 'string') {
            errors.push({
                field: 'results.summary',
                message: 'Summary must be a string',
                expected: 'string',
                received: typeof data.results.summary
            });
        }
        if (!Array.isArray(data.results.recommendations)) {
            errors.push({
                field: 'results.recommendations',
                message: 'Recommendations must be an array',
                expected: 'array',
                received: typeof data.results.recommendations
            });
        }
        else if (!data.results.recommendations.every((rec) => typeof rec === 'string')) {
            errors.push({
                field: 'results.recommendations',
                message: 'All recommendations must be strings',
                expected: 'string[]',
                received: 'mixed array'
            });
        }
        if (!Array.isArray(data.results.evidence_files)) {
            errors.push({
                field: 'results.evidence_files',
                message: 'Evidence files must be an array',
                expected: 'array',
                received: typeof data.results.evidence_files
            });
        }
        else if (!data.results.evidence_files.every((file) => typeof file === 'string')) {
            errors.push({
                field: 'results.evidence_files',
                message: 'All evidence files must be strings',
                expected: 'string[]',
                received: 'mixed array'
            });
        }
    }
    // Validate next_action
    const validActions = ['continue', 'fallback', 'manual_intervention'];
    if (!validActions.includes(data.next_action)) {
        errors.push({
            field: 'next_action',
            message: 'Invalid next action',
            expected: validActions.join(' | '),
            received: data.next_action
        });
    }
    // Validate metadata object
    if (typeof data.metadata !== 'object' || data.metadata === null) {
        errors.push({
            field: 'metadata',
            message: 'Metadata must be an object',
            expected: 'object',
            received: typeof data.metadata
        });
    }
    else {
        if (!Array.isArray(data.metadata.files_accessed)) {
            errors.push({
                field: 'metadata.files_accessed',
                message: 'Files accessed must be an array',
                expected: 'array',
                received: typeof data.metadata.files_accessed
            });
        }
        if (!Array.isArray(data.metadata.tools_used)) {
            errors.push({
                field: 'metadata.tools_used',
                message: 'Tools used must be an array',
                expected: 'array',
                received: typeof data.metadata.tools_used
            });
        }
        if (typeof data.metadata.token_usage_estimate !== 'number') {
            errors.push({
                field: 'metadata.token_usage_estimate',
                message: 'Token usage estimate must be a number',
                expected: 'number',
                received: typeof data.metadata.token_usage_estimate
            });
        }
    }
    // Validate optional errors array
    if (data.errors !== undefined) {
        if (!Array.isArray(data.errors)) {
            errors.push({
                field: 'errors',
                message: 'Errors must be an array',
                expected: 'array',
                received: typeof data.errors
            });
        }
        else {
            data.errors.forEach((error, index) => {
                if (typeof error !== 'object' || error === null) {
                    errors.push({
                        field: `errors[${index}]`,
                        message: 'Error must be an object',
                        expected: 'object',
                        received: typeof error
                    });
                }
                else {
                    if (typeof error.error_type !== 'string') {
                        errors.push({
                            field: `errors[${index}].error_type`,
                            message: 'Error type must be a string',
                            expected: 'string',
                            received: typeof error.error_type
                        });
                    }
                    if (typeof error.message !== 'string') {
                        errors.push({
                            field: `errors[${index}].message`,
                            message: 'Error message must be a string',
                            expected: 'string',
                            received: typeof error.message
                        });
                    }
                    if (typeof error.suggested_resolution !== 'string') {
                        errors.push({
                            field: `errors[${index}].suggested_resolution`,
                            message: 'Suggested resolution must be a string',
                            expected: 'string',
                            received: typeof error.suggested_resolution
                        });
                    }
                }
            });
        }
    }
    if (errors.length > 0) {
        return { success: false, errors };
    }
    return { success: true, data: data, errors: [] };
}
/**
 * Sanitize input data for safe processing
 *
 * @param data - Raw input data
 * @returns Sanitized data
 */
function sanitizeHandoffInput(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    const sanitized = { ...data };
    // Remove potentially dangerous properties
    delete sanitized.__proto__;
    delete sanitized.constructor;
    delete sanitized.prototype;
    // Sanitize string fields to prevent injection
    const sanitizeString = (str) => {
        return typeof str === 'string' ? str.replace(/[<>]/g, '') : str;
    };
    if (typeof sanitized.project === 'string') {
        sanitized.project = sanitizeString(sanitized.project);
    }
    if (typeof sanitized.task_id === 'string') {
        sanitized.task_id = sanitizeString(sanitized.task_id);
    }
    if (sanitized.context && typeof sanitized.context === 'object') {
        if (typeof sanitized.context.task_description === 'string') {
            sanitized.context.task_description = sanitizeString(sanitized.context.task_description);
        }
        if (Array.isArray(sanitized.context.requirements)) {
            sanitized.context.requirements = sanitized.context.requirements.map((req) => typeof req === 'string' ? sanitizeString(req) : req);
        }
        if (Array.isArray(sanitized.context.constraints)) {
            sanitized.context.constraints = sanitized.context.constraints.map((constraint) => typeof constraint === 'string' ? sanitizeString(constraint) : constraint);
        }
    }
    return sanitized;
}
/**
 * Create a HandoffError from validation failures
 *
 * @param errors - Validation errors
 * @param filePath - Optional file path where error occurred
 * @returns HandoffError instance
 */
function createValidationError(errors, filePath) {
    const errorMessages = errors.map(err => `${err.field}: ${err.message}`).join('; ');
    return {
        type: handoff_types_js_1.HandoffErrorType.SCHEMA_VALIDATION_ERROR,
        message: `Validation failed: ${errorMessages}`,
        file_path: filePath,
        timestamp: new Date().toISOString(),
        suggested_resolution: 'Review and correct the data structure according to the schema requirements'
    };
}
