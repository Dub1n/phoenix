const { coverageThresholds } = require('./scripts/coverage-thresholds');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/e2e'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 90000,
  maxWorkers: 1,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/e2e',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: coverageThresholds.e2e
  },
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};
