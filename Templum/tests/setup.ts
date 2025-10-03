import {
  createFallbackFormatter,
  createFormatterCapabilities,
  createFormatterFixture,
} from '../src/tests/helpers/terminal-formatter-fixtures';
import { resetDisplayStack } from '../src/utils/display-stack';

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

// Mock VSCode API for extension tests
const mockVSCode = {
  workspace: {
    getConfiguration: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    workspaceFolders: [],
  },
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showQuickPick: jest.fn(),
    createWebviewPanel: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path, path })),
    parse: jest.fn(),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
};

// Mock VSCode module for extension tests
jest.mock('vscode', () => mockVSCode, { virtual: true });

// Global test utilities
(global as any).testUtils = {
  createMockTimestamp: () => Date.now(),
  createMockId: () => Math.random().toString(36).substring(7),
  
  createMockBackendStatus: () => ({
    connected: true,
    health: 'healthy' as const,
    lastCheck: Date.now(),
    capabilities: ['analysis', 'testing'],
    responseTime: 100,
    version: '1.0.0'
  }),
  
  createMockSystemStatus: () => ({
    coreEngine: {
      initialized: true,
      activeInterfaces: ['vscode' as const],
      loadedSkins: [],
      backendConnections: {
        totalConnections: 0,
        healthyConnections: 0,
        backends: {}
      }
    },
    stateManager: {
      synchronized: true,
      globalState: { lastModified: Date.now(), backendStates: [] },
      sessionState: { startTime: Date.now(), totalCommands: 0, lastCommand: 'none' },
      subscribers: 0,
      historySize: 0,
      persistence: { enabled: true }
    },
    skinEngine: {
      cachedSkins: 0,
      renderers: { vscode: {}, cli: {}, command: {} },
      performance: { cacheHitRate: 0, averageRenderTime: 0 }
    },
    performance: {
      memory: { heapUsed: 0, rss: 0 },
      cpu: { user: 0, system: 0 },
      interfaces: {}
    }
  }),

  waitForAsync: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  expectEventEmitted: (eventEmitter: any, eventName: string, timeout: number = 1000) => {
    return new Promise<any>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Event '${eventName}' was not emitted within ${timeout}ms`));
      }, timeout);
      
      eventEmitter.once(eventName, (data: any) => {
        clearTimeout(timeoutHandle);
        resolve(data);
      });
    });
  },

  createFormatterFixture,
  createFallbackFormatter,
  createFormatterCapabilities,
};

// Setup global test environment
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.restoreAllMocks();
});

afterEach(() => {
  resetDisplayStack();
});
