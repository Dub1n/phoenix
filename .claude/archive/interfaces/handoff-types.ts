/**
 * File-Based Handoff Communication Types
 * 
 * Core TypeScript interfaces for subagent workflow handoff communication.
 * Implements TASK-SUBAGENT-001 foundational infrastructure.
 * 
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 236-281
 */

/**
 * Standard input format for agent handoff communication
 */
export interface HandoffInput {
  /** Project identifier (e.g., "Templum", "Phoenix-Code-Lite") */
  project: string;
  
  /** Unique task identifier for tracking */
  task_id: string;
  
  /** Phase of workflow execution */
  workflow_phase: 'research' | 'execution' | 'validation' | 'documentation';
  
  /** Task context and requirements */
  context: {
    /** Detailed description of the task */
    task_description: string;
    
    /** Array of specific requirements */
    requirements: string[];
    
    /** Array of constraints or limitations */
    constraints: string[];
    
    /** Optional relevant file paths */
    relevant_files?: string[];
    
    /** Results from previous workflow phases */
    previous_results?: any;
  };
  
  /** Execution parameters for agent control */
  execution_parameters: {
    /** Maximum execution time in milliseconds */
    max_execution_time: number;
    
    /** Confidence threshold for decision making */
    confidence_threshold: 'high' | 'medium' | 'low';
    
    /** Strategy for handling failures */
    fallback_strategy: string;
  };
}

/**
 * Standard output format for agent handoff results
 */
export interface HandoffOutput {
  /** Task identifier matching input */
  task_id: string;
  
  /** Execution status */
  status: 'success' | 'partial' | 'failed' | 'retry';
  
  /** Agent confidence in results */
  confidence: 'high' | 'medium' | 'low';
  
  /** Execution time in milliseconds */
  execution_time_ms: number;
  
  /** Primary results and data */
  results: {
    /** Main result data (type varies by workflow phase) */
    primary_data: any;
    
    /** Human-readable summary */
    summary: string;
    
    /** Array of actionable recommendations */
    recommendations: string[];
    
    /** Paths to evidence files created */
    evidence_files: string[];
  };
  
  /** Recommended next action */
  next_action: 'continue' | 'fallback' | 'manual_intervention';
  
  /** Optional error information */
  errors?: {
    /** Error type classification */
    error_type: string;
    
    /** Detailed error message */
    message: string;
    
    /** Suggested resolution steps */
    suggested_resolution: string;
  }[];
  
  /** Execution metadata */
  metadata: {
    /** Files accessed during execution */
    files_accessed: string[];
    
    /** Tools used during execution */
    tools_used: string[];
    
    /** Estimated token usage */
    token_usage_estimate: number;
  };
}

/**
 * File naming convention utility type
 */
export interface HandoffFileNaming {
  /** Base phase identifier */
  phase: 'research' | 'execution' | 'validation' | 'documentation';
  
  /** File type */
  type: 'context' | 'results';
  
  /** Task identifier */
  task_id: string;
  
  /** Timestamp (ISO string or formatted) */
  timestamp: string;
}

/**
 * Configuration for handoff directory management
 */
export interface HandoffConfig {
  /** Base path for handoff directory */
  base_path: string;
  
  /** Input file retention in days */
  input_retention_days: number;
  
  /** Output file retention in days */
  output_retention_days: number;
  
  /** Cleanup strategy */
  cleanup_strategy: 'automated' | 'manual' | 'disabled';
  
  /** File naming pattern */
  file_naming_pattern: string;
}

/**
 * Error types for handoff system
 */
export enum HandoffErrorType {
  FILE_ACCESS_ERROR = 'file_access_error',
  VALIDATION_ERROR = 'validation_error',
  TIMEOUT_ERROR = 'timeout_error',
  AGENT_UNAVAILABLE = 'agent_unavailable',
  CLEANUP_ERROR = 'cleanup_error',
  SCHEMA_VALIDATION_ERROR = 'schema_validation_error'
}

/**
 * Handoff system error interface
 */
export interface HandoffError {
  type: HandoffErrorType;
  message: string;
  file_path?: string;
  timestamp: string;
  suggested_resolution: string;
  retry_count?: number;
}
