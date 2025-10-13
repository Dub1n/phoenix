const { coverageThresholds } = require('./scripts/coverage-thresholds');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: coverageThresholds.unit
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
  testTimeout: 10000
};
