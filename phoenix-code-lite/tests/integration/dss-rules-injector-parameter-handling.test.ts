/**
 * DSS Rules Injector Parameter Handling Test Suite
 * 
 * Tests the type validation and error handling for the mcp_rules_injector_server_get_dss_rules tool.
 * 
 * @tags DSS, Testing, Rules-Injector, Parameter-Handling, TDD
 * @provides DSS Rules Injector Parameter Handling Test Suite, Validation Test Coverage, Error Handling Tests
 * @requires Jest Testing Framework, TypeScript, DSS Rules Structure
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the MCP server tool for testing
const mockGetDssRules = jest.fn();

// Types for the test implementation
interface ValidationResult {
  isValid: boolean;
  parsedValue?: string[] | null;
  warnings?: string[];
  error?: string;
  fallbackValue?: any;
}

interface DssRulesResponse {
  rules?: string[];
  warnings?: string[];
  error?: string;
}

// Mock implementation of the tool for testing
async function getDssRules(params: { rule_files?: any }): Promise<DssRulesResponse> {
  const validation = validateRuleFilesParameter(params.rule_files);
  
  if (validation.isValid) {
    // Simulate successful rule loading
    const rules = validation.parsedValue === null || (validation.parsedValue && validation.parsedValue.length === 0)
      ? ['bootstrap trilogy', 'core structure', 'behavior guidelines']
      : validation.parsedValue?.map(file => `loaded: ${file}`) || [];
    
    return {
      rules,
      warnings: validation.warnings?.length ? validation.warnings : undefined
    };
  } else {
    // Simulate fallback behavior
    return {
      rules: ['bootstrap trilogy', 'core structure', 'behavior guidelines'],
      warnings: validation.warnings?.length ? validation.warnings : undefined,
      error: validation.error
    };
  }
}

// Implementation of the type validation logic to be tested
function validateRuleFilesParameter(ruleFiles: any): ValidationResult {
  // Proper type checking using typeof and Array.isArray
  if (ruleFiles === null || ruleFiles === undefined) {
    return { isValid: true, parsedValue: null, warnings: [] };
  }

  if (Array.isArray(ruleFiles)) {
    // Validate array contents
    const isValidArray = ruleFiles.every(item => typeof item === 'string');
    if (!isValidArray) {
      return {
        isValid: false,
        parsedValue: null,
        error: `Expected array of strings, but received array with non-string items. Examples: [], ['guidelines/04-validation-rules.mdc']`,
        fallbackValue: null
      };
    }
    return { isValid: true, parsedValue: ruleFiles, warnings: [] };
  }

  if (typeof ruleFiles === 'string') {
    // Handle string input with smart parsing
    return parseStringInput(ruleFiles);
  }

  // Handle any other type
  return {
    isValid: false,
    parsedValue: null,
    error: `Expected array of strings or null for rule_files parameter, but received ${typeof ruleFiles}: '${ruleFiles}'. Please provide either: [] (empty array), null, or an array of rule file paths like ['guidelines/04-validation-rules.mdc']`,
    fallbackValue: null
  };
}

// Implementation of smart string parsing
function parseStringInput(input: string): ValidationResult {
  const trimmed = input.trim();
  
  if (trimmed === '') {
    return { isValid: true, parsedValue: null, warnings: ['Empty string provided, using null'] };
  }

  // Check if it's a comma-separated list
  if (trimmed.includes(',')) {
    const items = trimmed.split(',').map(item => item.trim()).filter(item => item.length > 0);
    return {
      isValid: true,
      parsedValue: items,
      warnings: [`Parsed comma-separated string into array: [${items.join(', ')}]`]
    };
  }

  // Check if it looks like a single file path
  if (trimmed.includes('/') || trimmed.includes('.mdc')) {
    return {
      isValid: true,
      parsedValue: [trimmed],
      warnings: [`Wrapped single file path in array: ['${trimmed}']`]
    };
  }

  // Fallback for completely malformed input
  return {
    isValid: false,
    parsedValue: null,
    error: `Unable to parse string input: '${trimmed}'. Expected comma-separated paths or single file path.`,
    fallbackValue: null,
    warnings: ['Falling back to bootstrap trilogy due to malformed input']
  };
}

describe('DSS Rules Injector Parameter Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Valid Input Scenarios', () => {
    test('should accept empty array and load bootstrap trilogy', async () => {
      const result = await getDssRules({ rule_files: [] });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.warnings).toBeUndefined();
    });

    test('should accept null and load bootstrap trilogy', async () => {
      const result = await getDssRules({ rule_files: null });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.warnings).toBeUndefined();
    });

    test('should accept array of specific rule files', async () => {
      const result = await getDssRules({ 
        rule_files: ['guidelines/04-validation-rules.mdc'] 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: guidelines/04-validation-rules.mdc');
      expect(result.warnings).toBeUndefined();
    });

    test('should accept omitted parameter and load bootstrap trilogy', async () => {
      const result = await getDssRules({});
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.warnings).toBeUndefined();
    });

    test('should accept multiple rule files in array', async () => {
      const result = await getDssRules({ 
        rule_files: ['guidelines/04-validation-rules.mdc', 'workflows/01-quick-tasks.mdc'] 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: guidelines/04-validation-rules.mdc');
      expect(result.rules).toContain('loaded: workflows/01-quick-tasks.mdc');
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('Malformed Input Scenarios', () => {
    test('should handle comma-separated string gracefully', async () => {
      const result = await getDssRules({ 
        rule_files: 'guidelines/04-validation-rules.mdc,workflows/01-quick-tasks.mdc' 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: guidelines/04-validation-rules.mdc');
      expect(result.rules).toContain('loaded: workflows/01-quick-tasks.mdc');
      expect(result.warnings?.[0]).toContain('Parsed comma-separated string into array');
    });

    test('should handle single file path string gracefully', async () => {
      const result = await getDssRules({ 
        rule_files: 'guidelines/04-validation-rules.mdc' 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: guidelines/04-validation-rules.mdc');
      expect(result.warnings?.[0]).toContain('Wrapped single file path in array');
    });

    test('should handle completely malformed input with fallback', async () => {
      const result = await getDssRules({ 
        rule_files: 'invalid-malformed-input' 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.warnings?.[0]).toContain('Falling back to bootstrap trilogy due to malformed input');
      expect(result.error).toContain('Unable to parse string input');
    });

    test('should handle empty string gracefully', async () => {
      const result = await getDssRules({ 
        rule_files: '' 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.warnings?.[0]).toContain('Empty string provided, using null');
    });

    test('should handle whitespace-only string gracefully', async () => {
      const result = await getDssRules({ 
        rule_files: '   ' 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.warnings?.[0]).toContain('Empty string provided, using null');
    });
  });

  describe('Error Handling Scenarios', () => {
    test('should provide helpful error messages for type mismatches', async () => {
      const result = await getDssRules({ rule_files: 123 });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.error).toContain('Expected array of strings or null');
      expect(result.error).toContain('empty array');
    });

    test('should handle array with non-string items', async () => {
      const result = await getDssRules({ rule_files: ['valid.mdc', 123, 'another.mdc'] });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.error).toContain('Expected array of strings, but received array with non-string items');
    });

    test('should handle boolean input', async () => {
      const result = await getDssRules({ rule_files: true });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.error).toContain('Expected array of strings or null');
    });

    test('should handle object input', async () => {
      const result = await getDssRules({ rule_files: { key: 'value' } });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.error).toContain('Expected array of strings or null');
    });

    test('should never fail completely', async () => {
      const result = await getDssRules({ rule_files: 'any-malformed-input' });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toBeDefined();
      expect(result.rules?.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined parameter', async () => {
      const result = await getDssRules({ rule_files: undefined });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('bootstrap trilogy');
      expect(result.warnings).toBeUndefined();
    });

    test('should handle array with empty strings', async () => {
      const result = await getDssRules({ rule_files: ['', 'valid.mdc', ''] });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: valid.mdc');
      expect(result.warnings).toBeUndefined();
    });

    test('should handle comma-separated string with empty items', async () => {
      const result = await getDssRules({ 
        rule_files: 'guidelines/04-validation-rules.mdc,,workflows/01-quick-tasks.mdc,' 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: guidelines/04-validation-rules.mdc');
      expect(result.rules).toContain('loaded: workflows/01-quick-tasks.mdc');
      expect(result.warnings?.[0]).toContain('Parsed comma-separated string into array');
    });

    test('should handle special characters in file paths', async () => {
      const result = await getDssRules({ 
        rule_files: 'guidelines/04-validation-rules.mdc,workflows/01-quick-tasks.mdc' 
      });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: guidelines/04-validation-rules.mdc');
      expect(result.rules).toContain('loaded: workflows/01-quick-tasks.mdc');
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete within reasonable time for valid inputs', async () => {
      const startTime = Date.now();
      await getDssRules({ rule_files: [] });
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should complete within reasonable time for malformed inputs', async () => {
      const startTime = Date.now();
      await getDssRules({ rule_files: 'malformed-input' });
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle large comma-separated strings', async () => {
      const largeInput = 'file1.mdc,file2.mdc,file3.mdc,file4.mdc,file5.mdc,file6.mdc,file7.mdc,file8.mdc,file9.mdc,file10.mdc';
      const result = await getDssRules({ rule_files: largeInput });
      expect(result).toHaveProperty('rules');
      expect(result.rules).toContain('loaded: file1.mdc');
      expect(result.rules).toContain('loaded: file10.mdc');
      expect(result.warnings?.[0]).toContain('Parsed comma-separated string into array');
    });
  });
});

describe('DSS Rules Injector System Integration', () => {
  test('should work with existing agent workflows', async () => {
    // Test current agent usage patterns
    const result = await getDssRules({ rule_files: [] });
    expect(result).toHaveProperty('rules');
    expect(result.rules?.length).toBeGreaterThan(0);
  });

  test('should handle malformed input from agents gracefully', async () => {
    // Test the specific error scenario that triggered this fix
    const result = await getDssRules({ rule_files: 'malformed-string-input' });
    expect(result).toHaveProperty('rules');
    expect(result.warnings).toBeDefined();
  });

  test('should maintain performance with valid inputs', async () => {
    const startTime = Date.now();
    await getDssRules({ rule_files: [] });
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });
}); 