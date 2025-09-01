/**
 * Jest Configuration for TASK-SKIN-007: Comprehensive Backend Validation Tests
 * 
 * This configuration is optimized for integration testing with real backend instances
 * and provides appropriate timeouts, environment setup, and resource management.
 */

module.exports = {
  // Test environment setup
  testEnvironment: 'node',
  
  // File patterns for comprehensive backend tests
  testMatch: [
    '**/tests/backend/comprehensive-backend-validation.test.ts',
    '**/tests/backend/**/*.integration.test.ts'
  ],
  
  // TypeScript support
  preset: 'ts-jest',
  
  // Extended timeouts for integration tests with real backends
  testTimeout: 60000, // 60 seconds per test
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/jest.backend.setup.js'],
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  
  // Test execution settings
  maxWorkers: 1, // Run tests sequentially to avoid port conflicts
  detectOpenHandles: true,
  forceExit: true,
  
  // Coverage settings (optional for integration tests)
  collectCoverage: false,
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    'src/core/templum-core.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/node_modules/**'
  ],
  
  // Output and reporting
  verbose: true,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'comprehensive-backend-validation.xml',
      suiteName: 'Comprehensive Backend Validation Tests'
    }]
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/examples/minimal-backend/node_modules/'
  ],
  
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false // Relaxed for integration tests
      }
    }
  },
  
  // Error handling
  errorOnDeprecated: false,
  
  // Cache configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter'
};