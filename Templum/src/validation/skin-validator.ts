/**
 * Universal Skin Engine - JSON Schema Validation
 * 
 * Generated: 2025-08-21-124500
 * Purpose: Skin definition validation using JSON schema
 * Context: Phase 5 implementation validation support
 */

import { UniversalSkinDefinition } from '../types/universal-skin-engine-types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate skin definition against Universal Skin Engine schema
 */
export function validateSkinDefinition(
  definition: UniversalSkinDefinition,
  schema: any
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

      if (!definition.metadata.targetInterfaces || definition.metadata.targetInterfaces.length === 0) {
        errors.push('Missing required field: metadata.targetInterfaces (must have at least one interface)');
      } else {
        const validInterfaces = ['vscode', 'cli', 'command'];
        for (const iface of definition.metadata.targetInterfaces) {
          if (!validInterfaces.includes(iface)) {
            errors.push(`Invalid target interface: ${iface}. Must be one of: ${validInterfaces.join(', ')}`);
          }
        }
      }

      if (!definition.metadata.backendService) {
        errors.push('Missing required field: metadata.backendService');
      }
    }

    // Validate menus structure
    if (!definition.menus) {
      errors.push('Missing required field: menus');
    } else {
      if (!definition.menus.main) {
        errors.push('Missing required field: menus.main');
      } else {
        if (!definition.menus.main.id) {
          errors.push('Missing required field: menus.main.id');
        }
        if (!definition.menus.main.title) {
          errors.push('Missing required field: menus.main.title');
        }
      }
    }

    // Validate commands structure
    if (!definition.commands) {
      errors.push('Missing required field: commands');
    } else {
      if (!definition.commands.primary) {
        errors.push('Missing required field: commands.primary');
      } else if (!Array.isArray(definition.commands.primary)) {
        errors.push('commands.primary must be an array');
      }

      if (!definition.commands.help) {
        errors.push('Missing required field: commands.help');
      }
    }

    // Validate theme structure
    if (!definition.theme) {
      errors.push('Missing required field: theme');
    } else {
      if (!definition.theme.name) {
        errors.push('Missing required field: theme.name');
      }
      if (!definition.theme.colors) {
        errors.push('Missing required field: theme.colors');
      } else {
        if (!definition.theme.colors.primary) {
          errors.push('Missing required field: theme.colors.primary');
        }
        if (!definition.theme.colors.background || !definition.theme.colors.background.primary) {
          errors.push('Missing required field: theme.colors.background.primary');
        }
        if (!definition.theme.colors.text || !definition.theme.colors.text.primary) {
          errors.push('Missing required field: theme.colors.text.primary');
        }
      }
    }

    // Validate backend config
    if (!definition.backendConfig) {
      errors.push('Missing required field: backendConfig');
    } else {
      if (!definition.backendConfig.service) {
        errors.push('Missing required field: backendConfig.service');
      }
      if (!definition.backendConfig.version) {
        errors.push('Missing required field: backendConfig.version');
      }
      if (!definition.backendConfig.endpoints) {
        errors.push('Missing required field: backendConfig.endpoints');
      }
    }

    // Validate workflows structure (if present)
    if (definition.workflows) {
      if (definition.workflows.workflows) {
        if (!Array.isArray(definition.workflows.workflows)) {
          errors.push('workflows.workflows must be an array');
        } else {
          definition.workflows.workflows.forEach((workflow, index) => {
            if (!workflow.id) {
              errors.push(`workflows.workflows[${index}].id is required`);
            }
            if (!workflow.name) {
              errors.push(`workflows.workflows[${index}].name is required`);
            }
            if (!workflow.steps || !Array.isArray(workflow.steps)) {
              errors.push(`workflows.workflows[${index}].steps must be an array`);
            }
          });
        }
      }
    }

    // Performance validation warnings
    if (definition.caching) {
      if (definition.caching.maxAge > 3600000) { // 1 hour
        warnings.push('Cache maxAge is very high (>1 hour), consider reducing for better memory usage');
      }
      if (definition.caching.maxSize > 1000) {
        warnings.push('Cache maxSize is very high (>1000), consider reducing for better memory usage');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
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
  if (!definition.metadata.performance) {
    warnings.push('No performance hints provided - consider adding for optimization');
  }

  // Check component count limits
  if (definition.views?.treeViews && definition.views.treeViews.length > 10) {
    warnings.push('High number of TreeViews (>10) may impact performance');
  }

  if (definition.views?.panels && definition.views.panels.length > 5) {
    warnings.push('High number of Panels (>5) may impact performance');
  }

  if (definition.commands?.primary && definition.commands.primary.length > 50) {
    warnings.push('High number of commands (>50) may impact command palette performance');
  }

  // Check for complex workflows
  if (definition.workflows?.workflows) {
    definition.workflows.workflows.forEach((workflow, index) => {
      if (workflow.steps && workflow.steps.length > 10) {
        warnings.push(`Workflow ${workflow.id} has many steps (${workflow.steps.length}) - consider breaking down`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}