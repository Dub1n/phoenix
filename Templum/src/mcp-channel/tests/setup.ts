/**
 * @fileoverview Test Setup
 * 
 * Jest test setup configuration for MCP Channel tests.
 * Provides common test utilities and environment setup.
 * 
 * @author VDL Vault
 * @since 2025-09-04
 */

// Global test configuration
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Suppress console output during tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Restore console methods
  if (!process.env.VERBOSE_TESTS) {
    jest.restoreAllMocks();
  }
});

// Test timeout configuration
jest.setTimeout(10000);