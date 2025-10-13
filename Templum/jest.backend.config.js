const { coverageThresholds } = require('./scripts/coverage-thresholds');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/backend/comprehensive-backend-validation.test.ts',
    '**/tests/backend/**/*.integration.test.ts'
  ],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/jest.backend.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  maxWorkers: 1,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    'src/core/templum-core.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: '<rootDir>/coverage/backend',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: coverageThresholds.backend
  },
  verbose: true,
  reporters: ['default'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/examples/minimal-backend/node_modules/'
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false
      }
    }
  },
  errorOnDeprecated: false,
  clearMocks: true,
  restoreMocks: true
};
