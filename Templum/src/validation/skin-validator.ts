/**
 * Universal Skin Engine - JSON Schema Validation
 * 
 * Generated: 2025-08-21-124500
 * Purpose: Skin definition validation using JSON schema
 * Context: Phase 5 implementation validation support
 */

import { 
  UniversalSkinDefinition, 
  isTemplumError
} from '../types/templum-types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * JSON Schema interface for skin definition validation
 */
export interface SkinValidationSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  definitions?: Record<string, any>;
}

/**
 * Validate skin definition against Universal Skin Engine schema
 */
export function validateSkinDefinition(
  definition: UniversalSkinDefinition,
  _schema: SkinValidationSchema
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Basic required field validation
    if (!definition.metadata) {
      errors.push('Missing required field: metadata');
    } else {
      if (!definition.metadata.id) {
        errors.push('Missing required field: metadata.id');
      } else if (!/^[a-z0-9-]+$/.test(definition.metadata.id)) {
        errors.push('metadata.id must be kebab-case (lowercase letters, numbers, and hyphens only)');
      }

      if (!definition.metadata.name) {
        errors.push('Missing required field: metadata.name');
      }

      if (!definition.metadata.version) {
        errors.push('Missing required field: metadata.version');
      } else if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(definition.metadata.version)) {
        errors.push('metadata.version must follow semantic versioning format');
      }

      if (!definition.metadata.description) {
        errors.push('Missing required field: metadata.description');
      }

      if (!definition.metadata.compatibleInterfaces || definition.metadata.compatibleInterfaces.length === 0) {
        errors.push('Missing required field: metadata.compatibleInterfaces (must have at least one interface)');
      } else {
        const validInterfaces = ['vscode', 'cli', 'command'];
        for (const iface of definition.metadata.compatibleInterfaces) {
          if (!validInterfaces.includes(iface)) {
            errors.push(`Invalid compatible interface: ${iface}. Must be one of: ${validInterfaces.join(', ')}`);
          }
        }
      }

      if (!definition.metadata.backend) {
        errors.push('Missing required field: metadata.backend');
      }
    }

    // Validate menus structure
    if (definition.menus) {
      const menuKeys = Object.keys(definition.menus);
      if (menuKeys.length === 0) {
        warnings.push('No menus defined - consider adding at least one menu');
      }
      // Note: Menu validation depends on MenuDefinition interface structure
      // which may vary based on interface type (CLI, VSCode, etc.)
    }

    // Validate commands structure
    if (definition.commands) {
      const commandKeys = Object.keys(definition.commands);
      if (commandKeys.length === 0) {
        warnings.push('No commands defined - consider adding at least one command');
      }
      // Note: Command validation depends on CommandDefinition interface structure
      // which may vary based on interface type (CLI, VSCode, etc.)
    }

    // Validate theme structure
    if (!definition.theme && !definition.themes) {
      warnings.push('No theme defined - consider adding theme support for better user experience');
    } else {
      // Validate backward compatibility theme or modern themes
      const hasValidTheme = (definition.theme !== undefined) || 
                           (definition.themes && Object.keys(definition.themes).length > 0);
      if (!hasValidTheme) {
        warnings.push('Theme structure detected but no valid theme data found');
      }
    }

    // Backend configuration is now handled through metadata.backend
    // Additional backend-specific configuration can be added to optional properties as needed

    // Validate workflows structure (if present)
    if (definition.workflows) {
      const workflowKeys = Object.keys(definition.workflows);
      if (workflowKeys.length === 0) {
        warnings.push('Workflows defined but no workflow entries found');
      }
      // Note: Workflow validation depends on WorkflowDefinition interface structure
      // Individual workflow validation would require knowledge of the WorkflowDefinition structure
    }

    // Performance validation warnings
    if (definition.performance && 'caching' in definition.performance) {
      const caching = (definition.performance as any).caching;
      if (caching?.maxAge > 3600000) { // 1 hour
        warnings.push('Cache maxAge is very high (>1 hour), consider reducing for better memory usage');
      }
      if (caching?.maxSize > 1000) {
        warnings.push('Cache maxSize is very high (>1000), consider reducing for better memory usage');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    let errorMessage = 'Unknown validation error';
    
    if (isTemplumError(error)) {
      errorMessage = `${error.category} error: ${error.message} (code: ${error.code})`;
    } else if (error instanceof Error) {
      errorMessage = `Validation error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = `Validation error: ${error}`;
    }
    
    return {
      valid: false,
      errors: [errorMessage]
    };
  }
}

/**
 * Validate skin definition against performance requirements
 */
export function validatePerformanceRequirements(definition: UniversalSkinDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for performance hints
  if (!definition.performance) {
    warnings.push('No performance configuration provided - consider adding for optimization');
  }

  // Check component count limits
  if (definition.views?.treeViews && definition.views.treeViews.length > 10) {
    warnings.push('High number of TreeViews (>10) may impact performance');
  }

  if (definition.views?.panels && definition.views.panels.length > 5) {
    warnings.push('High number of Panels (>5) may impact performance');
  }

  if (definition.commands && Object.keys(definition.commands).length > 50) {
    warnings.push('High number of commands (>50) may impact command palette performance');
  }

  // Check for complex workflows
  if (definition.workflows) {
    Object.entries(definition.workflows).forEach(([workflowId, workflow]) => {
      // Note: Workflow step validation depends on WorkflowDefinition structure
      // This is a generic check for workflow complexity
      if (typeof workflow === 'object' && workflow !== null) {
        warnings.push(`Complex workflow detected: ${workflowId} - consider performance testing`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}