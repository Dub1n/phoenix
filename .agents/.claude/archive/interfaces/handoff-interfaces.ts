/**---
- title: [Handoff System - Interface Definitions]
- tags: [Interface, Handoff, Communication, Subagent]
- provides: [HandoffInput, HandoffOutput, HandoffFileNaming, ExecutionParameters]
- requires: [TypeScript]
- description: [TypeScript interfaces for file-based handoff communication between main agent and subagents]        
- ---*/

/**
 * TASK-SUBAGENT-003 Handoff System Interface Definitions
 * File-based communication structures for Analysis Agent integration
 * Source: subagent-workflow-integration-design.md lines 236-281
 */

export interface HandoffInput {
  project: string;
  task_id: string;
  workflow_phase: 'research' | 'execution' | 'validation' | 'documentation';
  context: {
    task_description: string;
    requirements: string[];
    constraints: string[];
    relevant_files: string[];
  };
  execution_parameters: ExecutionParameters;
  metadata?: {
    created_at: string;
    timeout_ms: number;
    priority: 'high' | 'medium' | 'low';
  };
}

export interface HandoffOutput {
  task_id: string;
  agent_type: 'Analysis Agent' | 'Execution Agent';
  status: 'success' | 'partial' | 'failed' | 'retry';
  confidence: 'high' | 'medium' | 'low';
  execution_time_ms: number;
  results: {
    recommendations?: string[];
    selected_task?: {
      id: string;
      title: string;
      priority: number;
      complexity: number;
      pattern?: string;
    };
    pattern_analysis?: {
      relevant_patterns: string[];
      implementation_guidance: string[];
    };
    validation_results?: {
      status: 'passed' | 'failed' | 'partial';
      evidence: string[];
    };
    error_info?: {
      type: string;
      message: string;
      recovery_suggestions: string[];
    };
  };
  metadata: {
    completed_at: string;
    agent_version: string;
    fallback_triggered: boolean;
  };
}

export interface ExecutionParameters {
  max_execution_time: number; // in seconds
  confidence_threshold: 'high' | 'medium' | 'low';
  fallback_strategy: 'manual_analysis' | 'retry' | 'escalate';
  resource_limits?: {
    max_context_tokens: number;
    max_file_operations: number;
  };
}

export interface HandoffFileNaming {
  input_pattern: string; // "{phase}-context-{task-id}-{timestamp}.json"
  output_pattern: string; // "{phase}-results-{task-id}-{timestamp}.json" 
  archive_pattern: string; // "{phase}-archived-{task-id}-{timestamp}.json"
  retention_days: {
    input: number;
    output: number;
    archive: number;
  };
}

// Utility types for file management
export type HandoffPhase = 'research' | 'execution' | 'validation' | 'documentation';
export type AgentStatus = 'success' | 'partial' | 'failed' | 'retry';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
