---
date-created: 2025-09-15T100000Z
last-updated: 2025-09-15T100000Z
name: validator-utility-consolidation-pattern
description: Centralized validation utility to consolidate scattered validation logic, repeated patterns, and inconsistent data checks across data management components.
status: proposed
category: data-management
use-when:
  - Consolidating scattered input validation logic (e.g., port numbers, URLs).
  - Needing consistent schema validation for configuration or data objects.
  - Implementing chainable validation rules for improved readability and conciseness.
  - Requiring standardized error reporting for validation failures.
keywords:
  - validation-utilities
  - data-consistency
  - schema-validation
  - input-validation
  - type-checking
prerequisites:
  - logger-utility
  - error-handler-utility
related-patterns:
  - type-guards-utility
  - serialization-utils
---

### Validator Utility Consolidation Pattern

**Problem**: Validation logic is scattered and repeated across numerous data management and backend components, leading to inconsistent data handling, increased boilerplate, and potential for validation gaps. Components like `src/backend/connection-factory.ts` (`validateConfig`), `src/backend/service-discovery.ts` (health/process validation), and `src/backend/backend-service-router.ts` (BackendConfig validation) contain custom, unstandardized validation implementations.

**Current State Examples**:

```typescript
// In connection-factory.ts (validateConfig method)
function validateConfig(config: ConnectionConfig): boolean {
  if (!config.port || config.port < 1024 || config.port > 65535) {
    console.error('Invalid port:', config.port); // Inconsistent error reporting
    return false;
  }
  if (!config.url.startsWith('http')) {
    console.error('Invalid URL protocol:', config.url);
    return false;
  }
  // ... more manual checks
  return true;
}

// In service-discovery.ts (health validation)
function isServiceHealthy(service: ServiceDetails): boolean {
  if (typeof service.id !== 'string' || service.id.length === 0) {
    throw new Error('Service ID missing or invalid.'); // Unstandardized error handling
  }
  if (service.status !== 'running' && service.status !== 'active') {
    return false;
  }
  // ... manual checks for process details, etc.
  return true;
}
```

**Solution**: Centralized `ValidatorUtils` with a chainable API for common validation tasks (e.g., ports, URLs, schemas, custom rules), providing a minimal usage footprint and consistent error reporting. This utility will integrate with existing `logger-utility` and `error-handler-utility` for robust error management and clear feedback.

#### Validator Utils Implementation

**Core ValidatorUtils Class** (Minimal Usage Design):

```typescript
import { createLogger } from '../core/logger-utility';
import { ErrorHandler } from '../core/error-handler-utility';

export class ValidatorUtils {
  private static logger = createLogger('validator-utils');
  private static errorHandler = ErrorHandler; // Reference the static class directly

  // Fluent API for chainable validation
  static check(): ValidatorChain {
    return new ValidatorChain();
  }

  // One-line port validation
  static port(value: number, options?: { min?: number; max?: number }): ValidationResult {
    const { min = 1024, max = 65535 } = options || {};
    if (typeof value !== 'number' || value < min || value > max || !Number.isInteger(value)) {
      const error = `Port ${value} is invalid. Must be an integer between ${min} and ${max}.`;
      this.logger.warn(error);
      return { isValid: false, errors: [error] };
    }
    return { isValid: true, errors: [] };
  }

  // One-line URL validation
  static url(value: string, options?: { protocols?: string[] }): ValidationResult {
    const { protocols = ['http', 'https'] } = options || {};
    try {
      const url = new URL(value);
      if (!protocols.includes(url.protocol.replace(':', ''))) {
        const error = `URL protocol '${url.protocol}' is not allowed. Must be one of: ${protocols.join(', ')}.`;
        this.logger.warn(error);
        return { isValid: false, errors: [error] };
      }
      return { isValid: true, errors: [] };
    } catch (e) {
      const error = `Invalid URL format: ${value}.`;
      this.logger.warn(error, { originalError: e });
      return { isValid: false, errors: [error] };
    }
  }

  // Basic schema validation (placeholder for more robust schema validator like Ajv)
  static schema(data: any, schema: any): ValidationResult {
    // In a real scenario, integrate a dedicated schema validation library (e.g., Ajv)
    this.logger.debug('Performing schema validation (simplified)', { schema: schema, data: data });
    
    // Simple example: check if required fields exist
    if (schema && schema.required) {
      const missingFields = schema.required.filter((field: string) => !(field in data));
      if (missingFields.length > 0) {
        const error = `Missing required fields: ${missingFields.join(', ')}.`;
        this.logger.warn(error, { data, schema });
        return { isValid: false, errors: [error] };
      }
    }
    
    // Add more complex validation rules based on schema definition here
    // For production, consider a library like `ajv`
    
    return { isValid: true, errors: [] };
  }

  // Custom validation rule execution
  static custom(value: any, rule: (val: any) => boolean | string, errorMessage?: string): ValidationResult {
    const result = rule(value);
    if (typeof result === 'string') {
      this.logger.warn(result);
      return { isValid: false, errors: [result] };
    } else if (!result) {
      const error = errorMessage || `Custom validation failed for value: ${value}.`;
      this.logger.warn(error);
      return { isValid: false, errors: [error] };
    }
    return { isValid: true, errors: [] };
  }
}

// Fluent Validator Chain API
class ValidatorChain {
  private _errors: string[] = [];
  private _isValid: boolean = true;

  private addResult(result: ValidationResult): this {
    if (!result.isValid) {
      this._isValid = false;
      this._errors.push(...result.errors);
    }
    return this;
  }

  port(value: number, options?: { min?: number; max?: number }): this {
    return this.addResult(ValidatorUtils.port(value, options));
  }

  url(value: string, options?: { protocols?: string[] }): this {
    return this.addResult(ValidatorUtils.url(value, options));
  }

  schema(data: any, schema: any): this {
    return this.addResult(ValidatorUtils.schema(data, schema));
  }
  
  custom(value: any, rule: (val: any) => boolean | string, errorMessage?: string): this {
    return this.addResult(ValidatorUtils.custom(value, rule, errorMessage));
  }

  // Final check to get results
  validate(): ValidationResult {
    return {
      isValid: this._isValid,
      errors: [...this._errors], // Return a copy
    };
  }
  
  // Throw an error if invalid
  assert(): void {
    const result = this.validate();
    if (!result.isValid) {
      const errorMessage = 'One or more validation checks failed: ' + result.errors.join('; ');
      // Use the static ErrorHandler.handle to create and re-throw a TemplumError
      throw ValidatorUtils.errorHandler.handle(new Error(errorMessage), 'ValidatorChain.assert', { details: result.errors });
    }
  }
}

// Types
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Convenience exports
export const { check: validate, port: validatePort, url: validateUrl, schema: validateSchema, custom: validateCustom } = ValidatorUtils;
```

#### Usage Examples (Minimal Footprint)

**Before** (Current scattered approach):

```typescript
// In connection-factory.ts (20+ files affected)
if (!config.port || config.port < 1024) {
  console.error('Port invalid!');
  return false;
}

// In service-discovery.ts
if (typeof service.id !== 'string') {
  throw new Error('Service ID is not a string.');
}
```

**After** (One-line consolidated):

```typescript
// Simple port and URL validation
const portResult = validatePort(3000); // { isValid: true, errors: [] }
const urlResult = validateUrl('https://example.com'); // { isValid: true, errors: [] }

// Chainable validation for multiple properties
const config = { port: 8080, host: 'localhost', path: '/api' };
const schema = { required: ['port', 'host', 'path'], properties: { port: { type: 'number' } } };

const validationChainResult = validate()
  .port(config.port, { min: 8000 }) // Validate port with custom range
  .url(`http://${config.host}:${config.port}${config.path}`) // Validate a constructed URL
  .schema(config, schema) // Validate against a schema
  .custom(config.host, (h) => h !== 'evil.com', 'Host cannot be evil.com') // Custom rule
  .validate();

if (!validationChainResult.isValid) {
  console.error('Validation Errors:', validationChainResult.errors);
  // Centralized error handling
  // ErrorHandler.handleValidationErrors(validationChainResult.errors);
}

// Asserting validation for critical paths
try {
  validate().port(9000).url('http://valid.com').assert();
  console.log('Configuration is valid.');
} catch (e) {
  console.error('Configuration validation failed:', e.message);
}
```

#### Files Using This Pattern

**Backend Service Components**:

- [ ] `src/backend/connection-factory.ts` → Replace `validateConfig` and similar methods with `validate.port()`, `validate.url()`, `validate.schema()`
- [ ] `src/backend/service-discovery.ts` → Consolidate health and process validation with `validate.custom()` and schema validation.
- [ ] `src/backend/backend-service-router.ts` → Replace `BackendConfig` validation with `validate.schema()` and other specific checks.

**Configuration and Data Handling**:

- [ ] Components involving configuration loading and validation.
- [ ] Modules processing incoming data from external sources requiring data integrity checks.
- [ ] Any component with custom, repeated input validation logic.

**Impact**: ~12 files, ~200 lines reduction, consistent validation.

#### Expected Impact

**Quantitative Benefits**:\

- **Files Affected**: ~12 files with scattered validation logic.
- **Lines Reduced**: ~200 lines of manual and repeated validation code.
- **Components Unified**: Various custom validation functions, in-line checks, and schema validation.
- **Consistency**: 100% consistent data validation across all affected components.

**Qualitative Benefits**:

- **Fluent API**: Chainable validation calls improve readability and expressiveness.
- **Standardized Validation**: Ensures consistent application of validation rules across the codebase.
- **Reduced Boilerplate**: Eliminates repetitive `if/else` checks and custom error messages.
- **Improved Maintainability**: Centralized validation logic simplifies updates and new rule additions.
- **Developer Experience**: Intuitive API reduces the effort required to implement robust validation.
- **Early Error Detection**: Integrates with `logger-utility` and `error-handler-utility` for proactive issue identification.

#### Integration with Other Utilities

**Logger Integration**:

```typescript
// ValidatorUtils automatically logs warnings or errors during validation
const result = validatePort(600); // A warning will be logged if port is out of range
```

**Error Handler Integration**:

```typescript
// Validation failures can be escalated to the centralized error handler
try {
  validate().url('ftp://bad.com').assert(); // This will throw a managed error
} catch (e) {
  // ErrorHandler will catch and process this structured error
  console.error(e.message, e.details);
}
```

**Type Guards Utility Integration**:

```typescript
// Can be used in conjunction with type guards for robust type-safe validation
import { TypeGuards } from '../data/type-guards-utility-pattern'; 

const data = { name: 'Test', value: 123 };
if (TypeGuards.isObject(data) && validate.schema(data, { required: ['name'] }).isValid) {
  console.log('Data is a valid object with name.');
}}
```

#### Implementation Validation

**Before Migration**:

- [ ] Catalog all instances of input validation for common types (ports, URLs, emails, etc.).
- [ ] Identify components that perform schema validation or complex data structure checks.
- [ ] Map all disparate error reporting mechanisms for validation failures.

**During Migration**:

- [ ] Replace custom port, URL, and other basic input validations with `ValidatorUtils.port()`, `ValidatorUtils.url()`.
- [ ] Convert scattered schema validation logic to use `ValidatorUtils.schema()` (or an integrated schema library).
- [ ] Standardize custom validation rules using `ValidatorUtils.custom()`.
- [ ] Integrate validation results with `error-handler-utility` for consistent error reporting.

**After Migration**:

- [ ] Verify consistent application of validation rules across all affected components.
- [ ] Confirm proper error reporting and logging for validation failures.
- [ ] Test the chainable API for complex validation scenarios.
- [ ] Validate that data integrity is maintained post-migration.

#### Anti-Patterns

- **X** Don't manually check port ranges or URL formats; use `ValidatorUtils.port()` and `ValidatorUtils.url()`.
- **X** Don't implement custom schema validation logic; integrate with `ValidatorUtils.schema()` or a dedicated library.
- **X** Avoid disparate error messages for validation failures; leverage `ValidatorUtils` for standardized reporting.
- **X** Don't scatter `if/else` blocks for validation; use the chainable `validate()` API for conciseness.

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation
**Implementation Priority**: HIGH (Data consistency critical)
**Dependencies**: Logger Utility (for debug logging), Error Handler Utility (for error reporting and escalation)
**Integration Points**: Backend services, configuration management, data input processing, API endpoints.
**Migration Complexity**: Medium (requires refactoring existing validation logic and potentially integrating a schema library).
**Performance Impact**: Positive (centralized validation can be optimized, reduces redundant processing).
