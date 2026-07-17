/**
 * File Naming Convention Utilities
 * 
 * Utilities for generating consistent file names for handoff communication.
 * Implements file naming pattern: {phase}-{context|results}-{task-id}-{timestamp}.json
 * 
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 587-592
 */

import { HandoffFileNaming } from '../interfaces/handoff-types.js';

/**
 * Default configuration for file naming
 */
export const DEFAULT_NAMING_CONFIG = {
  dateFormat: 'yyyy-MM-dd-HHmm',
  extension: '.json',
  separator: '-'
} as const;

/**
 * Generate a standardized handoff filename
 * 
 * @param naming - File naming parameters
 * @returns Formatted filename following convention
 * 
 * @example
 * generateHandoffFilename({
 *   phase: 'research',
 *   type: 'context', 
 *   task_id: 'T001',
 *   timestamp: '2025-09-05-1400'
 * })
 * // Returns: "research-context-T001-2025-09-05-1400.json"
 */
export function generateHandoffFilename(naming: HandoffFileNaming): string {
  const { phase, type, task_id, timestamp } = naming;
  const { extension, separator } = DEFAULT_NAMING_CONFIG;
  
  return `${phase}${separator}${type}${separator}${task_id}${separator}${timestamp}${extension}`;
}

/**
 * Generate a timestamp in the standard format for handoff files
 * 
 * @param date - Optional date to format (defaults to current date)
 * @returns Formatted timestamp string (yyyy-MM-dd-HHmm)
 * 
 * @example
 * generateTimestamp() // "2025-09-05-1430"
 * generateTimestamp(new Date('2025-09-05T14:30:00')) // "2025-09-05-1430"
 */
export function generateTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${hours}${minutes}`;
}

/**
 * Parse a handoff filename to extract components
 * 
 * @param filename - Handoff filename to parse
 * @returns Parsed components or null if invalid format
 * 
 * @example
 * parseHandoffFilename("research-context-T001-2025-09-05-1400.json")
 * // Returns: { phase: 'research', type: 'context', task_id: 'T001', timestamp: '2025-0905-1400' }
 */
export function parseHandoffFilename(filename: string): HandoffFileNaming | null {
  const { extension, separator } = DEFAULT_NAMING_CONFIG;
  
  // Remove extension
  if (!filename.endsWith(extension)) {
    return null;
  }
  
  const nameWithoutExt = filename.slice(0, -extension.length);
  const parts = nameWithoutExt.split(separator);
  
  // Expected format: phase-type-task_id-timestamp
  if (parts.length !== 4) {
    return null;
  }
  
  const [phase, type, task_id, timestamp] = parts;
  
  // Validate phase
  const validPhases = ['research', 'execution', 'validation', 'documentation'];
  if (!validPhases.includes(phase)) {
    return null;
  }
  
  // Validate type
  const validTypes = ['context', 'results'];
  if (!validTypes.includes(type)) {
    return null;
  }
  
  return {
    phase: phase as HandoffFileNaming['phase'],
    type: type as HandoffFileNaming['type'],
    task_id,
    timestamp
  };
}

/**
 * Generate input filename for a task
 * 
 * @param phase - Workflow phase
 * @param task_id - Task identifier
 * @param timestamp - Optional timestamp (defaults to current)
 * @returns Input filename
 */
export function generateInputFilename(
  phase: HandoffFileNaming['phase'],
  task_id: string,
  timestamp?: string
): string {
  return generateHandoffFilename({
    phase,
    type: 'context',
    task_id,
    timestamp: timestamp || generateTimestamp()
  });
}

/**
 * Generate output filename for a task
 * 
 * @param phase - Workflow phase
 * @param task_id - Task identifier
 * @param timestamp - Optional timestamp (defaults to current)
 * @returns Output filename
 */
export function generateOutputFilename(
  phase: HandoffFileNaming['phase'],
  task_id: string,
  timestamp?: string
): string {
  return generateHandoffFilename({
    phase,
    type: 'results',
    task_id,
    timestamp: timestamp || generateTimestamp()
  });
}

/**
 * Validate filename format
 * 
 * @param filename - Filename to validate
 * @returns true if filename follows convention
 */
export function isValidHandoffFilename(filename: string): boolean {
  return parseHandoffFilename(filename) !== null;
}

/**
 * Generate a unique task ID
 * 
 * @param prefix - Optional prefix (defaults to 'T')
 * @returns Unique task ID
 * 
 * @example
 * generateTaskId() // "T001"
 * generateTaskId('SUB') // "SUB001"
 */
export function generateTaskId(prefix: string = 'T'): string {
  const timestamp = Date.now().toString(36); // Base-36 timestamp
  const random = Math.random().toString(36).substr(2, 3); // 3 random chars
  return `${prefix}${timestamp}${random}`.toUpperCase();
}
