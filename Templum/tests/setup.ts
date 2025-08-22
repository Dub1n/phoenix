/**---
 * title: [Test Setup - Global Test Configuration]
 * tags: [Testing, Setup, Jest, Environment]
 * provides: [Test Environment Setup, Global Configuration, Test Utilities]
 * requires: [Jest, Node.js]
 * description: [Global test setup and configuration for Templum test suite]
 * ---*/

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  // Keep error and warn for important messages
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Global test utilities
(global as any).testUtils = {
  createMockTimestamp: () => Date.now(),
  createMockId: () => Math.random().toString(36).substring(7),
};

// Setup global test environment
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.restoreAllMocks();
});