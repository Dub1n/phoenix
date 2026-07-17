/**
 * Refactor Protocol Security & Validation Module
 * 
 * Purpose: Input validation, sanitization, and security protection for the refactor protocol system
 * Implementation: Phase 1 Critical Security & Stability improvements
 * 
 * This module provides comprehensive security features including:
 * - Input sanitization and validation
 * - Template injection protection
 * - Path traversal protection
 * - Security middleware for all operations
 * - Validation schemas for different data types
 * 
 * @module RefactorProtocolSecurity
 * @version 1.0.0
 * @requires refactor_protocol_system
 */

// Comprehensive input sanitization
export class InputSanitizer {
  
  // Sanitize string inputs
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }
    
    // Remove null bytes and control characters
    let sanitized = input
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
  
  // Sanitize file paths
  static sanitizePath(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Path must be a string');
    }
    
    // Remove dangerous characters and patterns
    let sanitized = input
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/\.\./g, '') // Remove directory traversal attempts
      .replace(/\/{2,}/g, '/') // Normalize multiple slashes
      .trim();
    
    // Ensure path doesn't start with dangerous patterns
    if (sanitized.startsWith('..') || sanitized.startsWith('/etc') || sanitized.startsWith('/sys')) {
      throw new SecurityError('Path contains dangerous patterns');
    }
    
    return sanitized;
  }
  
  // Sanitize template content
  static sanitizeTemplate(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Template must be a string');
    }
    
    // Remove potentially dangerous template injection patterns
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/{{.*?}}/g, (match) => {
        // Allow only safe template variables
        const variable = match.slice(2, -2).trim();
        if (this.isSafeTemplateVariable(variable)) {
          return match;
        }
        return `[INVALID_VARIABLE:${variable}]`;
      });
    
    return sanitized;
  }
  
  // Check if template variable is safe
  private static isSafeTemplateVariable(variable: string): boolean {
    const safePatterns = [
      /^project\.(language|framework|testing_framework|coverage_target)$/,
      /^current\.(file|function|module|code_snippet)$/,
      /^metrics\.(current_coverage|function_complexity|target_complexity)$/,
      /^separation\.(file1|file2|purpose1|purpose2|strategy)$/
    ];
    
    return safePatterns.some(pattern => pattern.test(variable));
  }
  
  // Sanitize object inputs
  static sanitizeObject(input: any, schema: ValidationSchema): any {
    if (typeof input !== 'object' || input === null) {
      throw new ValidationError('Input must be an object');
    }
    
    const sanitized: any = {};
    
    for (const [key, fieldSchema] of Object.entries(schema)) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeValue(input[key], fieldSchema);
      } else if (fieldSchema.required) {
        throw new ValidationError(`Required field missing: ${key}`);
      } else if (fieldSchema.default !== undefined) {
        sanitized[key] = fieldSchema.default;
      }
    }
    
    return sanitized;
  }
  
  // Sanitize individual values
  private static sanitizeValue(value: any, schema: FieldSchema): any {
    if (schema.type === 'string') {
      if (typeof value !== 'string') {
        throw new ValidationError(`Expected string, got ${typeof value}`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        value = value.substring(0, schema.maxLength);
      }
      return value;
    }
    
    if (schema.type === 'number') {
      if (typeof value !== 'number') {
        throw new ValidationError(`Expected number, got ${typeof value}`);
      }
      if (schema.min !== undefined && value < schema.min) {
        throw new ValidationError(`Value too small: ${value} < ${schema.min}`);
      }
      if (schema.max !== undefined && value > schema.max) {
        throw new ValidationError(`Value too large: ${value} > ${schema.max}`);
      }
      return value;
    }
    
    if (schema.type === 'boolean') {
      if (typeof value !== 'boolean') {
        throw new ValidationError(`Expected boolean, got ${typeof value}`);
      }
      return value;
    }
    
    if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        throw new ValidationError(`Expected array, got ${typeof value}`);
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        throw new ValidationError(`Array too long: ${value.length} > ${schema.maxItems}`);
      }
      if (schema.itemSchema) {
        return value.map(item => this.sanitizeValue(item, schema.itemSchema!));
      }
      return value;
    }
    
    if (schema.type === 'object') {
      if (typeof value !== 'object' || value === null) {
        throw new ValidationError(`Expected object, got ${typeof value}`);
      }
      if (schema.objectSchema) {
        return this.sanitizeObject(value, schema.objectSchema);
      }
      return value;
    }
    
    throw new ValidationError(`Unknown schema type: ${schema.type}`);
  }
}

/**
 * Template security and validation
 * 
 * This class provides functionality to validate and sanitize templates
 * to prevent potential security vulnerabilities such as script injection,
 * event handler injection, and unsafe template variables.
 * 
 * @module TemplateSecurityManager
 * @version 1.0.0
 */
export class TemplateSecurityManager {
  
  // Validate template for security
  static validateTemplate(template: string): TemplateValidationResult {
    const issues: SecurityIssue[] = [];
    
    // Check for script injection
    if (template.includes('<script')) {
      issues.push({
        type: 'script_injection',
        severity: 'critical',
        message: 'Template contains potential script injection'
      });
    }
    
    // Check for event handler injection
    const eventMatches = template.match(/on\w+\s*=/g);
    if (eventMatches) {
      issues.push({
        type: 'event_handler_injection',
        severity: 'high',
        message: 'Template contains potential event handler injection'
      });
    }
    
    // Check for unsafe template variables
    const unsafeVariables = this.findUnsafeTemplateVariables(template);
    if (unsafeVariables.length > 0) {
      issues.push({
        type: 'unsafe_template_variable',
        severity: 'medium',
        message: `Template contains unsafe variables: ${unsafeVariables.join(', ')}`
      });
    }
    
    // Check for path traversal attempts
    if (template.includes('..')) {
      issues.push({
        type: 'path_traversal',
        severity: 'critical',
        message: 'Template contains potential path traversal'
      });
    }
    
    const securityScore = this.calculateSecurityScore(issues);
    
    return {
      isValid: issues.length === 0,
      issues,
      securityScore
    };
  }
  
  // Find unsafe template variables
  private static findUnsafeTemplateVariables(template: string): string[] {
    const variableMatches = template.match(/\{\{([^}]+)\}\}/g);
    if (!variableMatches) return [];
    
    return variableMatches
      .map(match => match.slice(2, -2).trim())
      .filter(variable => !this.isSafeTemplateVariable(variable));
  }
  
  // Check if template variable is safe
  private static isSafeTemplateVariable(variable: string): boolean {
    const safePatterns = [
      /^project\.(language|framework|testing_framework|coverage_target)$/,
      /^current\.(file|function|module|code_snippet)$/,
      /^metrics\.(current_coverage|function_complexity|target_complexity)$/,
      /^separation\.(file1|file2|purpose1|purpose2|strategy)$/
    ];
    
    return safePatterns.some(pattern => pattern.test(variable));
  }
  
  // Calculate security score
  private static calculateSecurityScore(issues: SecurityIssue[]): number {
    if (issues.length === 0) return 100;
    
    let totalDeduction = 0;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          totalDeduction += 40;
          break;
        case 'high':
          totalDeduction += 25;
          break;
        case 'medium':
          totalDeduction += 15;
          break;
        case 'low':
          totalDeduction += 5;
          break;
      }
    }
    
    return Math.max(0, 100 - totalDeduction);
  }
  
  // Find line number for issue
  private static findLineNumber(template: string, pattern: string): number {
    const lines = template.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return 0;
  }
  
  // Sanitize template to remove security issues
  static sanitizeTemplate(template: string): string {
    let sanitized = template;
    
    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Replace unsafe template variables
    sanitized = sanitized.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const trimmedVariable = variable.trim();
      if (this.isSafeTemplateVariable(trimmedVariable)) {
        return match;
      }
      return `[INVALID_VARIABLE:${trimmedVariable}]`;
    });
    
    // Remove path traversal attempts
    sanitized = sanitized.replace(/\.\./g, '');
    
    return sanitized;
  }
}

/**
 * Path security and validation
 * 
 * This class provides functionality to validate and sanitize file paths
 * to prevent potential security vulnerabilities such as null bytes,
 * directory traversal, and access to dangerous system paths.
 * 
 * @module PathSecurityManager
 * @version 1.0.0
 */
export class PathSecurityManager {
  
  // Validate file path for security
  static validatePath(path: string, baseDirectory: string): PathValidationResult {
    const issues: PathSecurityIssue[] = [];
    
    // Check for null bytes
    if (path.includes('\0')) {
      issues.push({
        type: 'null_byte',
        severity: 'critical',
        message: 'Path contains null bytes'
      });
    }
    
    // Check for directory traversal attempts
    if (path.includes('..')) {
      issues.push({
        type: 'directory_traversal',
        severity: 'critical',
        message: 'Path contains directory traversal attempts'
      });
    }
    
    // Check for absolute paths outside base directory
    if (path.startsWith('/') && !path.startsWith(baseDirectory)) {
      issues.push({
        type: 'absolute_path_violation',
        severity: 'high',
        message: 'Path is outside base directory'
      });
    }
    
    // Check for dangerous system paths
    const dangerousPaths = ['/etc', '/sys', '/proc', '/dev', '/var/log'];
    for (const dangerousPath of dangerousPaths) {
      if (path.startsWith(dangerousPath)) {
        issues.push({
          type: 'dangerous_system_path',
          severity: 'critical',
          message: `Path accesses dangerous system directory: ${dangerousPath}`
        });
      }
    }
    
    // Resolve path
    let resolvedPath: string;
    try {
      resolvedPath = this.resolvePath(path, baseDirectory);
    } catch (error: unknown) {
      issues.push({
        type: 'path_resolution_error',
        severity: 'high',
        message: `Path resolution failed: ${error instanceof Error ? error.message : String(error)}`
      });
      resolvedPath = path;
    }
    
    // Check if resolved path is within base directory
    if (!this.isPathWithinBase(resolvedPath, baseDirectory)) {
      issues.push({
        type: 'path_outside_base',
        severity: 'high',
        message: 'Resolved path is outside base directory'
      });
    }
    
    const securityScore = this.calculatePathSecurityScore(issues);
    
    return {
      isValid: issues.length === 0,
      issues,
      resolvedPath,
      securityScore
    };
  }
  
  // Resolve path against base directory
  private static resolvePath(path: string, baseDirectory: string): string {
    // Handle absolute paths
    if (path.startsWith('/')) {
      return path;
    }
    
    // Handle relative paths
    if (path.startsWith('./') || path.startsWith('../')) {
      // For now, use a simple path resolution
      // In a real implementation, you'd use proper path resolution
      return `${baseDirectory}/${path}`;
    }
    
    // Relative path - resolve against base directory
    return `${baseDirectory}/${path}`;
  }
  
  // Check if path is within base directory
  private static isPathWithinBase(path: string, baseDirectory: string): boolean {
    const normalizedPath = path.replace(/\/{2,}/g, '/');
    const normalizedBase = baseDirectory.replace(/\/{2,}/g, '/');
    
    return normalizedPath.startsWith(normalizedBase);
  }
  
  // Calculate path security score
  private static calculatePathSecurityScore(issues: PathSecurityIssue[]): number {
    if (issues.length === 0) return 100;
    
    let totalDeduction = 0;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          totalDeduction += 40;
          break;
        case 'high':
          totalDeduction += 25;
          break;
        case 'medium':
          totalDeduction += 15;
          break;
        case 'low':
          totalDeduction += 5;
          break;
      }
    }
    
    return Math.max(0, 100 - totalDeduction);
  }
  
  // Sanitize path to remove security issues
  static sanitizePath(path: string): string {
    let sanitized = path;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Remove directory traversal attempts
    sanitized = sanitized.replace(/\.\./g, '');
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '');
    
    // Normalize multiple slashes
    sanitized = sanitized.replace(/\/{2,}/g, '/');
    
    // Remove leading slashes for relative paths
    if (sanitized.startsWith('/') && !sanitized.startsWith('/home') && !sanitized.startsWith('/tmp')) {
      sanitized = sanitized.substring(1);
    }
    
    return sanitized;
  }
}

/**
 * Validation schema types
 * 
 * Defines the structure and constraints for different data types
 * used in the refactor protocol system.
 * 
 * @module ValidationSchema
 * @version 1.0.0
 */
export interface ValidationSchema {
  [key: string]: FieldSchema;
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  maxLength?: number;
  min?: number;
  max?: number;
  maxItems?: number;
  itemSchema?: FieldSchema;
  objectSchema?: ValidationSchema;
}

/**
 * Common validation schemas
 * 
 * Reusable schemas for validating different types of data.
 * 
 * @module CommonSchemas
 * @version 1.0.0
 */
export const ProjectContextSchema: ValidationSchema = {
  language: {
    type: 'string',
    required: true,
    maxLength: 50
  },
  framework: {
    type: 'string',
    required: true,
    maxLength: 100
  },
  testing_framework: {
    type: 'string',
    required: false,
    maxLength: 100
  },
  coverage_target: {
    type: 'number',
    required: false,
    min: 0,
    max: 100,
    default: 90
  }
};

export const FileAnalysisSchema: ValidationSchema = {
  total_files: {
    type: 'number',
    required: true,
    min: 0
  },
  files: {
    type: 'array',
    required: true,
    maxItems: 10000,
    itemSchema: {
      type: 'object',
      objectSchema: {
        name: { type: 'string', required: true, maxLength: 500 },
        path: { type: 'string', required: true, maxLength: 1000 },
        size: { type: 'number', required: true, min: 0 },
        language: { type: 'string', required: false, maxLength: 50 }
      }
    }
  }
};

export const TestCoverageSchema: ValidationSchema = {
  overall: {
    type: 'number',
    required: true,
    min: 0,
    max: 100
  },
  modules: {
    type: 'array',
    required: true,
    maxItems: 1000,
    itemSchema: {
      type: 'object',
      objectSchema: {
        name: { type: 'string', required: true, maxLength: 200 },
        coverage: { type: 'number', required: true, min: 0, max: 100 },
        lines: { type: 'number', required: true, min: 0 }
      }
    }
  }
};

/**
 * Centralized input validation class
 * 
 * This class provides methods to validate and sanitize different
 * types of data against predefined schemas.
 * 
 * @module InputValidator
 * @version 1.0.0
 */
export class InputValidator {
  
  // Validate project context with comprehensive schema
  static validateProjectContext(context: any): ValidationResult {
    return this.validateObject(context, ProjectContextSchema);
  }
  
  // Validate file analysis data
  static validateFileAnalysis(analysis: any): ValidationResult {
    return this.validateObject(analysis, FileAnalysisSchema);
  }
  
  // Validate test coverage data
  static validateTestCoverage(coverage: any): ValidationResult {
    return this.validateObject(coverage, TestCoverageSchema);
  }
  
  // Validate refactoring configuration
  static validateRefactoringConfig(config: any): ValidationResult {
    return this.validateObject(config, RefactoringConfigSchema);
  }
  
  // Validate agent responses
  static validateAgentResponse(response: any): ValidationResult {
    return this.validateObject(response, AgentResponseSchema);
  }
  
  // Generic object validation
  private static validateObject(obj: any, schema: ValidationSchema): ValidationResult {
    try {
      const sanitized = InputSanitizer.sanitizeObject(obj, schema);
      const issues = this.detectValidationIssues(obj, schema);
      
      return {
        isValid: issues.length === 0,
        sanitized,
        issues,
        securityScore: this.calculateSecurityScore(issues)
      };
    } catch (error) {
      return {
        isValid: false,
        sanitized: null,
        issues: [{
          type: 'validation_error',
          severity: 'high',
          message: error.message
        }],
        securityScore: 0
      };
    }
  }
  
  // Detect validation issues
  private static detectValidationIssues(obj: any, schema: ValidationSchema): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    for (const [field, fieldSchema] of Object.entries(schema)) {
      const value = obj[field];
      
      // Check required fields
      if (fieldSchema.required && (value === undefined || value === null)) {
        issues.push({
          type: 'missing_required_field',
          severity: 'high',
          message: `Required field '${field}' is missing`,
          field,
          value
        });
        continue;
      }
      
      // Skip validation for undefined optional fields
      if (value === undefined || value === null) {
        continue;
      }
      
      // Type validation
      if (!this.validateFieldType(value, fieldSchema)) {
        issues.push({
          type: 'type_mismatch',
          severity: 'medium',
          message: `Field '${field}' has invalid type. Expected ${fieldSchema.type}, got ${typeof value}`,
          field,
          value
        });
      }
      
      // Length/range validation
      const rangeIssues = this.validateFieldRange(value, fieldSchema);
      issues.push(...rangeIssues);
      
      // Recursive validation for objects and arrays
      if (fieldSchema.type === 'object' && fieldSchema.objectSchema) {
        const objectIssues = this.detectValidationIssues(value, fieldSchema.objectSchema);
        issues.push(...objectIssues.map(issue => ({
          ...issue,
          field: `${field}.${issue.field}`
        })));
      }
      
      if (fieldSchema.type === 'array' && fieldSchema.itemSchema) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (fieldSchema.itemSchema!.type === 'object' && fieldSchema.itemSchema!.objectSchema) {
              const itemIssues = this.detectValidationIssues(item, fieldSchema.itemSchema!.objectSchema);
              issues.push(...itemIssues.map(issue => ({
                ...issue,
                field: `${field}[${index}].${issue.field}`
              })));
            } else {
              const itemIssues = this.validateFieldRange(item, fieldSchema.itemSchema!);
              issues.push(...itemIssues.map(issue => ({
                ...issue,
                field: `${field}[${index}]`
              })));
            }
          });
        }
      }
    }
    
    return issues;
  }
  
  // Validate field type
  private static validateFieldType(value: any, schema: FieldSchema): boolean {
    switch (schema.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }
  
  // Validate field range constraints
  private static validateFieldRange(value: any, schema: FieldSchema): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    if (schema.type === 'string' && typeof value === 'string') {
      if (schema.maxLength && value.length > schema.maxLength) {
        issues.push({
          type: 'length_violation',
          severity: 'medium',
          message: `Field exceeds maximum length of ${schema.maxLength}`,
          field: 'unknown',
          value: value.length
        });
      }
    }
    
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        issues.push({
          type: 'range_violation',
          severity: 'medium',
          message: `Value ${value} is below minimum ${schema.min}`,
          field: 'unknown',
          value
        });
      }
      
      if (schema.max !== undefined && value > schema.max) {
        issues.push({
          type: 'range_violation',
          severity: 'medium',
          message: `Value ${value} is above maximum ${schema.max}`,
          field: 'unknown',
          value
        });
      }
    }
    
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.maxItems && value.length > schema.maxItems) {
        issues.push({
          type: 'array_size_violation',
          severity: 'medium',
          message: `Array exceeds maximum size of ${schema.maxItems}`,
          field: 'unknown',
          value: value.length
        });
      }
    }
    
    return issues;
  }
  
  // Calculate security score based on issues
  private static calculateSecurityScore(issues: SecurityIssue[]): number {
    if (issues.length === 0) return 100;
    
    let totalPenalty = 0;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          totalPenalty += 40;
          break;
        case 'high':
          totalPenalty += 25;
          break;
        case 'medium':
          totalPenalty += 15;
          break;
        case 'low':
          totalPenalty += 5;
          break;
      }
    }
    
    return Math.max(0, 100 - totalPenalty);
  }
}

/**
 * Additional validation schemas
 * 
 * Reusable schemas for specific configurations and agent responses.
 * 
 * @module AdditionalSchemas
 * @version 1.0.0
 */
export const RefactoringConfigSchema: ValidationSchema = {
  target_language: {
    type: 'string',
    required: true,
    maxLength: 50
  },
  target_framework: {
    type: 'string',
    required: false,
    maxLength: 100
  },
  quality_threshold: {
    type: 'number',
    required: false,
    min: 0,
    max: 100,
    default: 80
  },
  max_iterations: {
    type: 'number',
    required: false,
    min: 1,
    max: 10,
    default: 3
  },
  preserve_comments: {
    type: 'boolean',
    required: false,
    default: true
  },
  optimization_level: {
    type: 'string',
    required: false,
    maxLength: 20,
    default: 'balanced'
  }
};

export const AgentResponseSchema: ValidationSchema = {
  content: {
    type: 'string',
    required: true,
    maxLength: 10000
  },
  confidence: {
    type: 'number',
    required: false,
    min: 0,
    max: 100,
    default: 80
  },
  suggestions: {
    type: 'array',
    required: false,
    maxItems: 20,
    itemSchema: {
      type: 'string',
      maxLength: 500
    }
  },
  metadata: {
    type: 'object',
    required: false,
    objectSchema: {
      model: { type: 'string', required: false, maxLength: 100 },
      tokens_used: { type: 'number', required: false, min: 0 },
      response_time: { type: 'number', required: false, min: 0 }
    }
  }
};

export const PhaseExecutionSchema: ValidationSchema = {
  phase_name: {
    type: 'string',
    required: true,
    maxLength: 100
  },
  status: {
    type: 'string',
    required: true,
    maxLength: 50
  },
  start_time: {
    type: 'number',
    required: true,
    min: 0
  },
  end_time: {
    type: 'number',
    required: false,
    min: 0
  },
  results: {
    type: 'object',
    required: false,
    objectSchema: {
      success: { type: 'boolean', required: true },
      output_files: { type: 'array', required: false, maxItems: 100, itemSchema: { type: 'string', maxLength: 500 } },
      metrics: { type: 'object', required: false }
    }
  },
  errors: {
    type: 'array',
    required: false,
    maxItems: 50,
    itemSchema: {
      type: 'object',
      objectSchema: {
        message: { type: 'string', required: true, maxLength: 1000 },
        severity: { type: 'string', required: true, maxLength: 20 },
        timestamp: { type: 'number', required: true, min: 0 }
      }
    }
  }
};

/**
 * Security middleware for input validation
 * 
 * This class provides a wrapper around input validation,
 * sanitization, and security checks for the refactor protocol.
 * 
 * @module SecurityMiddleware
 * @version 1.0.0
 */
export class SecurityMiddleware {
  
  // Validate all inputs before processing
  static validateInputs(inputs: any, schema: ValidationSchema): ValidationResult {
    try {
      const sanitized = InputSanitizer.sanitizeObject(inputs, schema);
      return {
        isValid: true,
        sanitized,
        issues: []
      };
    } catch (error) {
      return {
        isValid: false,
        sanitized: null,
        issues: [{
          type: 'validation_error',
          severity: 'high',
          message: error.message
        }]
      };
    }
  }
  
  // Validate template before execution
  static validateTemplate(template: string): TemplateValidationResult {
    return TemplateSecurityManager.validateTemplate(template);
  }
  
  // Validate file path before operations
  static validatePath(path: string, baseDirectory: string): PathValidationResult {
    return PathSecurityManager.validatePath(path, baseDirectory);
  }
  
  // Comprehensive security check using InputValidator
  static performComprehensiveSecurityCheck(inputs: any, template: string, filePath: string, baseDirectory: string): SecurityCheckResult {
    const results = {
      inputs: InputValidator.validateProjectContext(inputs),
      template: this.validateTemplate(template),
      path: this.validatePath(filePath, baseDirectory)
    };
    
    const allValid = results.inputs.isValid && results.template.isValid && results.path.isValid;
    const overallScore = Math.min(
      results.inputs.securityScore || 100,
      results.template.securityScore,
      results.path.securityScore
    );
    
    return {
      isValid: allValid,
      overallScore,
      results,
      recommendations: this.generateSecurityRecommendations(results)
    };
  }
  
  // Validate refactoring configuration
  static validateRefactoringConfiguration(config: any): ValidationResult {
    return InputValidator.validateRefactoringConfig(config);
  }
  
  // Validate file analysis data
  static validateFileAnalysisData(analysis: any): ValidationResult {
    return InputValidator.validateFileAnalysis(analysis);
  }
  
  // Validate test coverage data
  static validateTestCoverageData(coverage: any): ValidationResult {
    return InputValidator.validateTestCoverage(coverage);
  }
  
  // Validate agent response
  static validateAgentResponseData(response: any): ValidationResult {
    return InputValidator.validateAgentResponse(response);
  }
  
  // Validate phase execution data
  static validatePhaseExecutionData(phaseData: any): ValidationResult {
    return InputValidator.validateObject(phaseData, PhaseExecutionSchema);
  }
  
  // Batch validation for multiple inputs
  static validateBatch(inputs: Record<string, any>): BatchValidationResult {
    const results: Record<string, ValidationResult> = {};
    let overallValid = true;
    let totalScore = 0;
    let validCount = 0;
    
    for (const [key, value] of Object.entries(inputs)) {
      let result: ValidationResult;
      
      // Route to appropriate validator based on key
      switch (key) {
        case 'projectContext':
          result = InputValidator.validateProjectContext(value);
          break;
        case 'refactoringConfig':
          result = InputValidator.validateRefactoringConfig(value);
          break;
        case 'fileAnalysis':
          result = InputValidator.validateFileAnalysis(value);
          break;
        case 'testCoverage':
          result = InputValidator.validateTestCoverage(value);
          break;
        case 'agentResponse':
          result = InputValidator.validateAgentResponse(value);
          break;
        case 'phaseExecution':
          result = InputValidator.validateObject(value, PhaseExecutionSchema);
          break;
        default:
          // Generic validation for unknown types
          result = {
            isValid: false,
            sanitized: null,
            issues: [{
              type: 'unknown_input_type',
              severity: 'medium',
              message: `Unknown input type: ${key}`
            }],
            securityScore: 0
          };
      }
      
      results[key] = result;
      if (result.isValid) {
        totalScore += result.securityScore || 0;
        validCount++;
      } else {
        overallValid = false;
      }
    }
    
    const averageScore = validCount > 0 ? totalScore / validCount : 0;
    
    return {
      overallValid,
      averageScore,
      results,
      summary: this.generateBatchValidationSummary(results)
    };
  }
  
  // Generate batch validation summary
  private static generateBatchValidationSummary(results: Record<string, ValidationResult>): string[] {
    const summary: string[] = [];
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    
    for (const [key, result] of Object.entries(results)) {
      if (!result.isValid) {
        const criticalCount = result.issues.filter(issue => issue.severity === 'critical').length;
        const highCount = result.issues.filter(issue => issue.severity === 'high').length;
        
        if (criticalCount > 0) {
          criticalIssues.push(`${key}: ${criticalCount} critical issues`);
        }
        if (highCount > 0) {
          warnings.push(`${key}: ${highCount} high-severity issues`);
        }
      }
    }
    
    if (criticalIssues.length > 0) {
      summary.push(`Critical issues found: ${criticalIssues.join(', ')}`);
    }
    if (warnings.length > 0) {
      summary.push(`High-severity warnings: ${warnings.join(', ')}`);
    }
    
    if (summary.length === 0) {
      summary.push('All inputs validated successfully');
    }
    
    return summary;
  }
  
  // Comprehensive security check
  static performSecurityCheck(inputs: any, template: string, filePath: string, baseDirectory: string): SecurityCheckResult {
    const results = {
      inputs: this.validateInputs(inputs, ProjectContextSchema),
      template: this.validateTemplate(template),
      path: this.validatePath(filePath, baseDirectory)
    };
    
    const allValid = results.inputs.isValid && results.template.isValid && results.path.isValid;
    const overallScore = Math.min(
      results.inputs.securityScore || 100,
      results.template.securityScore,
      results.path.securityScore
    );
    
    return {
      isValid: allValid,
      overallScore,
      results,
      recommendations: this.generateSecurityRecommendations(results)
    };
  }
  
  // Generate security recommendations
  private static generateSecurityRecommendations(results: any): string[] {
    const recommendations: string[] = [];
    
    if (!results.inputs.isValid) {
      recommendations.push('Fix input validation issues before proceeding');
    }
    
    if (!results.template.isValid) {
      recommendations.push('Sanitize template to remove security vulnerabilities');
    }
    
    if (!results.path.isValid) {
      recommendations.push('Use safe file paths that don\'t attempt directory traversal');
    }
    
    if (results.template.securityScore < 80) {
      recommendations.push('Review template for potential security issues');
    }
    
    if (results.path.securityScore < 80) {
      recommendations.push('Review file path for potential security issues');
    }
    
    return recommendations;
  }
}

/**
 * Security and validation errors
 * 
 * Custom error classes for handling validation and security issues.
 * 
 * @module ErrorHandling
 * @version 1.0.0
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class TemplateSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateSecurityError';
  }
}

export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathSecurityError';
  }
}

/**
 * Validation result types
 * 
 * Defines the structure of validation results and security issues.
 * 
 * @module ResultTypes
 * @version 1.0.0
 */
export interface ValidationResult {
  isValid: boolean;
  sanitized: any | null;
  issues: SecurityIssue[];
  securityScore?: number;
}

export interface TemplateValidationResult {
  isValid: boolean;
  issues: SecurityIssue[];
  securityScore: number;
}

export interface PathValidationResult {
  isValid: boolean;
  issues: PathSecurityIssue[];
  resolvedPath: string;
  securityScore: number;
}

export interface SecurityCheckResult {
  isValid: boolean;
  overallScore: number;
  results: {
    inputs: ValidationResult;
    template: TemplateValidationResult;
    path: PathValidationResult;
  };
  recommendations: string[];
}

export interface BatchValidationResult {
  overallValid: boolean;
  averageScore: number;
  results: Record<string, ValidationResult>;
  summary: string[];
}

/**
 * Security issue types
 * 
 * Defines the structure of security issues detected during validation.
 * 
 * @module SecurityIssueTypes
 * @version 1.0.0
 */
export interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  field?: string;
  value?: any;
}

export interface PathSecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

/**
 * Usage examples
 * 
 * Demonstrates how to use the security and validation system.
 * 
 * @module UsageExamples
 * @version 1.0.0
 */

/**
 * Basic Input Validation
 * 
 * Example: Validating a project context.
 */
export function basicInputValidationExample() {
  // Validate project context
  const projectContext = {
    language: 'Python',
    framework: 'Django',
    coverage_target: 95
  };

  const validationResult = InputValidator.validateProjectContext(projectContext);

  if (validationResult.isValid) {
    console.log('✅ Input validation passed');
    const sanitized = validationResult.sanitized;
    // Use sanitized input
  } else {
    console.log('❌ Input validation failed:', validationResult.issues);
  }
}

/**
 * Template Security Validation
 * 
 * Example: Validating a template for security.
 */
export function templateSecurityValidationExample() {
  // Validate template for security
  const template = 'Analyzing {{project.language}} project with {{project.framework}}';

  const templateResult = SecurityMiddleware.validateTemplate(template);

  if (templateResult.isValid) {
    console.log('✅ Template security validation passed');
    console.log(`Security score: ${templateResult.securityScore}/100`);
  } else {
    console.log('❌ Template security validation failed:', templateResult.issues);
    
    // Sanitize template
    const sanitized = TemplateSecurityManager.sanitizeTemplate(template);
    console.log('Sanitized template:', sanitized);
  }
}

/**
 * Path Security Validation
 * 
 * Example: Validating a file path.
 */
export function pathSecurityValidationExample() {
  // Validate file path
  const filePath = './src/components/UserProfile.tsx';
  const baseDirectory = '/home/user/project';

  const pathResult = SecurityMiddleware.validatePath(filePath, baseDirectory);

  if (pathResult.isValid) {
    console.log('✅ Path security validation passed');
    console.log(`Resolved path: ${pathResult.resolvedPath}`);
  } else {
    console.log('❌ Path security validation failed:', pathResult.issues);
  }
}

/**
 * Comprehensive Security Check
 * 
 * Example: Performing a comprehensive security check.
 */
export function comprehensiveSecurityCheckExample() {
  // Perform comprehensive security check
  const securityResult = SecurityMiddleware.performComprehensiveSecurityCheck(
    projectContext,
    template,
    filePath,
    baseDirectory
  );

  if (securityResult.isValid) {
    console.log('✅ All security checks passed');
    console.log(`Overall security score: ${securityResult.overallScore}/100`);
  } else {
    console.log('❌ Security check failed');
    console.log(`Overall security score: ${securityResult.overallScore}/100`);
    console.log('Recommendations:', securityResult.recommendations);
  }
}

/**
 * Batch Validation
 * 
 * Example: Validating multiple inputs at once.
 */
export function batchValidationExample() {
  // Validate multiple inputs at once
  const batchInputs = {
    projectContext: { language: 'TypeScript', framework: 'React' },
    refactoringConfig: { target_language: 'TypeScript', quality_threshold: 85 },
    fileAnalysis: { total_files: 150, files: [] }
  };

  const batchResult = SecurityMiddleware.validateBatch(batchInputs);

  if (batchResult.overallValid) {
    console.log('✅ All batch inputs validated successfully');
    console.log(`Average security score: ${batchResult.averageScore}/100`);
  } else {
    console.log('❌ Batch validation failed');
    console.log('Summary:', batchResult.summary);
    
    // Check individual results
    for (const [key, result] of Object.entries(batchResult.results)) {
      if (!result.isValid) {
        console.log(`${key} validation failed:`, result.issues);
      }
    }
  }
}

/**
 * Integration with Core Protocol
 * 
 * This security and validation system integrates with the core refactor protocol by:
 * 
 * 1. Wrapping all input processing with validation and sanitization
 * 2. Validating all templates before execution to prevent injection attacks
 * 3. Protecting file operations with path validation and sanitization
 * 4. Providing security scoring to help identify potential issues
 * 5. Generating recommendations for improving security posture
 * 
 * To integrate with existing protocol:
 * 
 * 1. Wrap all user inputs with `InputValidator.validateProjectContext()`
 * 2. Validate all templates with `SecurityMiddleware.validateTemplate()`
 * 3. Validate all file paths with `SecurityMiddleware.validatePath()`
 * 4. Use comprehensive security checks before critical operations
 * 5. Handle security errors gracefully with user-friendly messages
 * 
 * @module Integration
 * @version 1.0.0
 */
