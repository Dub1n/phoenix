module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  // Removed ES module configuration that was causing conflicts
  // Project uses CommonJS, so keep configuration simple and compatible
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // Extended timeout for performance tests
  testTimeout: 30000, // 30 seconds for performance tests
};