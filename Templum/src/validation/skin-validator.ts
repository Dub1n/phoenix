/**
 * Universal Skin Engine - JSON Schema Validation
 *
 * Ajv-backed validator for Universal Skin Definitions. Compiles the
 * schema once per version and normalises warning/error output so the
 * skin engine can enforce the contract consistently across adapters.
 */

import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import { UniversalSkinDefinition, isTemplumError } from '../types/templum-types';
import universalSkinSchema from '../../schemas/universal-skin-engine-validation.json';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface SkinValidationResult extends ValidationResult {
  schemaVersion?: string | null;
  issues?: SkinValidationIssue[];
}

export interface SkinValidationIssue {
  path: string;
  message: string;
}

export interface SkinValidationSchema extends Record<string, unknown> {
  $id?: string;
  version?: string;
  definitions?: Record<string, unknown>;
  additionalProperties?: boolean | Record<string, unknown>;
}

export interface SkinValidationOptions {
  schema?: SkinValidationSchema;
  expectedValidatorVersion?: string;
  collectWarnings?: boolean;
}

const DEFAULT_SCHEMA: SkinValidationSchema = universalSkinSchema as SkinValidationSchema;
const validatorCache = new Map<string, ValidateFunction>();

function cloneSchema<T extends Record<string, unknown>>(schema: T): T {
  return JSON.parse(JSON.stringify(schema));
}

function ensureSchemaDefinitions(schema: SkinValidationSchema): SkinValidationSchema {
  if (typeof schema.definitions !== 'object' || schema.definitions === null) {
    schema.definitions = {};
  }

  schema.additionalProperties = true;

  const missing = new Set<string>();

  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') {
      return;
    }

    const candidate = node as Record<string, unknown>;

    if (typeof candidate.$ref === 'string') {
      const match = candidate.$ref.match(/^#\/definitions\/(.+)$/);
      if (match) {
        const definitionName = match[1];
        const definitions = schema.definitions as Record<string, unknown>;
        if (!(definitionName in definitions)) {
          missing.add(definitionName);
        }
      }
    }

    for (const value of Object.values(candidate)) {
      visit(value);
    }
  };

  visit(schema);

  const definitions = schema.definitions as Record<string, unknown>;
  for (const definitionName of missing) {
    if (!(definitionName in definitions)) {
      definitions[definitionName] = {};
    }
  }

  return schema;
}

function createAjv() {
  return new Ajv({
    allErrors: true,
    strict: false,
    allowUnionTypes: true,
    useDefaults: true
  });
}

function schemaCacheKey(schema: SkinValidationSchema): string {
  const version = extractSchemaVersion(schema);
  if (version) {
    return version;
  }
  return JSON.stringify(schema);
}

function extractSchemaVersion(schema: SkinValidationSchema): string | null {
  if (typeof schema.$id === 'string') {
    const match = schema.$id.match(/v(\d+\.\d+\.\d+)/i);
    if (match) {
      return match[1];
    }
  }
  if (typeof schema.version === 'string') {
    return schema.version;
  }
  return null;
}

function compileValidator(schema: SkinValidationSchema): { validator: ValidateFunction; schemaVersion: string | null } {
  const cacheKey = schemaCacheKey(schema);
  let validator = validatorCache.get(cacheKey);

  if (!validator) {
    const ajv = createAjv();
    validator = ajv.compile(schema);
    validatorCache.set(cacheKey, validator);
  }

  return { validator: validator!, schemaVersion: extractSchemaVersion(schema) };
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): SkinValidationIssue[] {
  if (!errors) {
    return [];
  }

  return errors.map<SkinValidationIssue>(error => {
    let path = (error.instancePath || '').replace(/^\//, '').replace(/\//g, '.');
    let message = error.message ?? 'Invalid value';

    if (error.keyword === 'required' && typeof (error.params as any)?.missingProperty === 'string') {
      const missing = (error.params as any).missingProperty;
      path = path ? `${path}.${missing}` : missing;
      message = 'is required';
    }

    if (error.keyword === 'additionalProperties' && typeof (error.params as any)?.additionalProperty === 'string') {
      const additional = (error.params as any).additionalProperty;
      path = path ? `${path}.${additional}` : additional;
      message = 'is not allowed';
    }

    return {
      path,
      message
    };
  });
}

function collectManualIssues(definition: UniversalSkinDefinition): SkinValidationIssue[] {
  const issues: SkinValidationIssue[] = [];

  if (!definition.id) {
    issues.push({ path: 'id', message: 'is required' });
  }
  if (!definition.name) {
    issues.push({ path: 'name', message: 'is required' });
  }
  if (!definition.version) {
    issues.push({ path: 'version', message: 'is required' });
  }

  if (!definition.metadata) {
    issues.push({ path: 'metadata', message: 'is required' });
    return issues;
  }

  if (!definition.metadata.id) {
    issues.push({ path: 'metadata.id', message: 'is required' });
  }
  if (!definition.metadata.name) {
    issues.push({ path: 'metadata.name', message: 'is required' });
  }
  if (!definition.metadata.version) {
    issues.push({ path: 'metadata.version', message: 'is required' });
  }
  if (!definition.metadata.backendService) {
    issues.push({ path: 'metadata.backendService', message: 'is required' });
  }
  if (!definition.metadata.compatibleInterfaces || definition.metadata.compatibleInterfaces.length === 0) {
    issues.push({ path: 'metadata.compatibleInterfaces', message: 'must include at least one interface' });
  }

  if (
    definition.version &&
    definition.metadata.version &&
    definition.version !== definition.metadata.version
  ) {
    issues.push({
      path: 'metadata.version',
      message: `does not match root version ${definition.version}`
    });
  }

  return issues;
}

function collectWarnings(definition: UniversalSkinDefinition): string[] {
  const warnings: string[] = [];

  if (definition.menus && Object.keys(definition.menus).length === 0) {
    warnings.push('No menus defined - consider providing at least one menu');
  }

  if (definition.commands && Object.keys(definition.commands).length === 0) {
    warnings.push('No commands defined - consider providing interactive commands');
  }

  if (!definition.theme && !definition.themes) {
    warnings.push('No theme information provided - rendering may fall back to defaults');
  }

  if (definition.performance && 'caching' in definition.performance) {
    const caching = (definition.performance as any).caching;
    if (caching?.maxAge > 3600000) {
      warnings.push('Cache maxAge is very high (>1 hour)');
    }
    if (caching?.maxSize > 1000) {
      warnings.push('Cache maxSize is very high (>1000 entries)');
    }
  }

  if (definition.workflows) {
    const entries = Object.keys(definition.workflows);
    if (entries.length === 0) {
      warnings.push('Workflows object is present but empty');
    }
  }

  return Array.from(new Set(warnings));
}

export function validateSkinDefinition(
  definition: UniversalSkinDefinition,
  options: SkinValidationOptions = {}
): SkinValidationResult {
  const rawSchema = cloneSchema(options.schema ?? DEFAULT_SCHEMA);
  const preparedSchema = ensureSchemaDefinitions(rawSchema);
  const { validator, schemaVersion } = compileValidator(preparedSchema);
  const issues: SkinValidationIssue[] = [];
  const warnings: string[] = [];

  try {
    const valid = validator(definition);
    if (!valid) {
      issues.push(...formatAjvErrors(validator.errors));
    }
  } catch (error) {
    if (isTemplumError(error)) {
      issues.push({ path: 'schema', message: `${error.category} error: ${error.message}` });
    } else if (error instanceof Error) {
      issues.push({ path: 'schema', message: error.message });
    } else {
      issues.push({ path: 'schema', message: 'Unknown schema validation error' });
    }
  }

  issues.push(...collectManualIssues(definition));

  if (options.collectWarnings !== false) {
    warnings.push(...collectWarnings(definition));
  }

  if (options.expectedValidatorVersion) {
    if (!schemaVersion) {
      issues.push({
        path: '$id',
        message: `Schema version unavailable; expected ${options.expectedValidatorVersion}`
      });
    } else if (options.expectedValidatorVersion !== schemaVersion) {
      issues.push({
        path: '$id',
        message: `Schema version mismatch: expected ${options.expectedValidatorVersion}, received ${schemaVersion}`
      });
    }
  }

  const errorMessages = issues.map(issue => (issue.path ? `${issue.path}: ${issue.message}` : issue.message));
  const uniqueWarnings = warnings.length > 0 ? Array.from(new Set(warnings)) : undefined;

  if (errorMessages.length > 0 && process.env.TEMPLUM_SCHEMA_DEBUG === '1') {
    console.error('[skin-validator] validation failed', {
      errors: errorMessages,
      warnings: uniqueWarnings,
      schemaVersion
    });
  }

  return {
    valid: errorMessages.length === 0,
    errors: errorMessages,
    warnings: uniqueWarnings,
    schemaVersion,
    issues
  };
}

export function validatePerformanceRequirements(definition: UniversalSkinDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!definition.performance) {
    warnings.push('No performance configuration provided - consider adding for optimization');
  }

  if (definition.views?.treeViews && definition.views.treeViews.length > 10) {
    warnings.push('High number of TreeViews (>10) may impact performance');
  }

  if (definition.views?.panels && definition.views.panels.length > 5) {
    warnings.push('High number of Panels (>5) may impact performance');
  }

  if (definition.commands && Object.keys(definition.commands).length > 50) {
    warnings.push('High number of commands (>50) may impact command palette performance');
  }

  if (definition.workflows) {
    Object.entries(definition.workflows).forEach(([workflowId, workflow]) => {
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
