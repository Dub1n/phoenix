/**
 * Jest Setup for TASK-SKIN-007: Comprehensive Backend Validation Tests
 * 
 * Provides global setup, teardown, and utilities for integration tests
 * that use real backend instances.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Global test configuration
global.BACKEND_TEST_CONFIG = {
  // Port ranges for test backends
  BASE_PORT: 3001,
  PORT_RANGE: [3001, 3002, 3003, 3004, 3005],
  
  // Timeouts
  BACKEND_STARTUP_TIMEOUT: 5000,
  BACKEND_SHUTDOWN_TIMEOUT: 3000,
  TEST_OPERATION_TIMEOUT: 2000,
  
  // Paths
  MINIMAL_BACKEND_PATH: path.join(__dirname, 'examples/minimal-backend'),
  TEST_RESULTS_DIR: path.join(__dirname, 'test-results'),
  
  // Test data
  TEST_BACKENDS: new Map()
};

/**
 * Global test utilities
 */
global.testUtils = {
  /**
   * Wait for a condition to be true with timeout
   */
  waitFor: async (condition, timeout = 5000, interval = 100) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  /**
   * Check if a port is available
   */
  isPortAvailable: (port) => {
    const net = require('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  },
  
  /**
   * Find an available port from the test port range
   */
  findAvailablePort: async () => {
    const { PORT_RANGE } = global.BACKEND_TEST_CONFIG;
    
    for (const port of PORT_RANGE) {
      if (await global.testUtils.isPortAvailable(port)) {
        return port;
      }
    }
    
    throw new Error('No available ports in test range');
  },
  
  /**
   * Create test directories
   */
  ensureTestDirectories: () => {
    const { TEST_RESULTS_DIR } = global.BACKEND_TEST_CONFIG;
    
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
      fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
    }
  },
  
  /**
   * Clean up test artifacts
   */
  cleanupTestArtifacts: () => {
    // Clean up any service registration files
    const templumDir = path.join(__dirname, '.templum');
    if (fs.existsSync(templumDir)) {
      const servicesDir = path.join(templumDir, 'services');
      if (fs.existsSync(servicesDir)) {
        const files = fs.readdirSync(servicesDir);
        files.forEach(file => {
          if (file.includes('test-') || file.includes('minimal-example-')) {
            const filePath = path.join(servicesDir, file);
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
        });
      }
    }
    
    // Clean up backend log files
    const minimalBackendDir = global.BACKEND_TEST_CONFIG.MINIMAL_BACKEND_PATH;
    if (fs.existsSync(minimalBackendDir)) {
      const logFile = path.join(minimalBackendDir, 'backend.log');
      if (fs.existsSync(logFile)) {
        try {
          fs.unlinkSync(logFile);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }
};

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('🔧 Setting up comprehensive backend test environment...');
  
  // Ensure test directories exist
  global.testUtils.ensureTestDirectories();
  
  // Clean up any previous test artifacts
  global.testUtils.cleanupTestArtifacts();
  
  // Verify minimal backend dependencies are installed
  const minimalBackendPath = global.BACKEND_TEST_CONFIG.MINIMAL_BACKEND_PATH;
  const nodeModulesPath = path.join(minimalBackendPath, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing minimal backend dependencies...');
    try {
      execSync('npm install', { 
        cwd: minimalBackendPath, 
        stdio: 'pipe' 
      });
      console.log('✅ Minimal backend dependencies installed');
    } catch (error) {
      console.error('❌ Failed to install minimal backend dependencies');
      throw error;
    }
  }
  
  console.log('✅ Test environment setup complete');
}, 30000); // 30 second timeout for global setup

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Kill any remaining backend processes
  const { TEST_BACKENDS } = global.BACKEND_TEST_CONFIG;
  
  for (const [id, backend] of TEST_BACKENDS.entries()) {
    if (backend.process && !backend.process.killed) {
      console.log(`🛑 Stopping test backend: ${id}`);
      backend.process.kill('SIGTERM');
      
      // Force kill after 2 seconds
      setTimeout(() => {
        if (!backend.process.killed) {
          backend.process.kill('SIGKILL');
        }
      }, 2000);
    }
  }
  
  // Clean up test artifacts
  global.testUtils.cleanupTestArtifacts();
  
  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Test environment cleanup complete');
}, 10000); // 10 second timeout for global teardown

/**
 * Setup for each test suite
 */
beforeEach(() => {
  // Reset any global state if needed
  jest.clearAllMocks();
});

/**
 * Teardown for each test suite
 */
afterEach(async () => {
  // Individual test cleanup can be added here if needed
});

/**
 * Enhanced error reporting for integration tests
 */
const originalConsoleError = console.error;
console.error = (...args) => {
  // Capture and format integration test errors
  if (args[0] && typeof args[0] === 'string') {
    if (args[0].includes('Backend') || args[0].includes('Connection')) {
      const timestamp = new Date().toISOString();
      originalConsoleError(`[${timestamp}] BACKEND_TEST_ERROR:`, ...args);
      return;
    }
  }
  
  originalConsoleError(...args);
};

/**
 * Jest environment extensions for backend testing
 */
expect.extend({
  /**
   * Custom matcher for backend health status
   */
  toBeHealthyBackend(received) {
    const pass = received && 
                  received.status === 'healthy' && 
                  typeof received.uptime === 'number' && 
                  received.uptime >= 0;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a healthy backend`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a healthy backend with status 'healthy' and valid uptime`,
        pass: false,
      };
    }
  },
  
  /**
   * Custom matcher for backend capability profiles
   */
  toHaveValidCapabilityProfile(received) {
    const requiredFields = ['backendId', 'hasHealthEndpoint', 'hasCapabilitiesEndpoint', 'hasVersionEndpoint', 'skinDefinitionQuality'];
    const validQualities = ['complete', 'partial', 'minimal'];
    
    const hasRequiredFields = requiredFields.every(field => received.hasOwnProperty(field));
    const hasValidQuality = validQualities.includes(received.skinDefinitionQuality);
    const hasValidBooleans = ['hasHealthEndpoint', 'hasCapabilitiesEndpoint', 'hasVersionEndpoint']
      .every(field => typeof received[field] === 'boolean');
    
    const pass = hasRequiredFields && hasValidQuality && hasValidBooleans;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have a valid capability profile`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have a valid capability profile with required fields and valid values`,
        pass: false,
      };
    }
  }
});

console.log('🧪 Jest setup for comprehensive backend validation loaded');