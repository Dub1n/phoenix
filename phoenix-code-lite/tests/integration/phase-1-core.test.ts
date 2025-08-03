import { CoreFoundation } from '../../src/core/foundation';
import { SessionManager } from '../../src/core/session-manager';
import { ModeManager } from '../../src/core/mode-manager';
import { ConfigManager } from '../../src/core/config-manager';
import { ErrorHandler, ErrorSeverity, ErrorCategory } from '../../src/core/error-handler';
import { CoreInfrastructure } from '../../src/core/index';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('Phase 1 Core Infrastructure', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = join(__dirname, '..', 'temp', `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Environment Validation', () => {
    it('should validate system environment', async () => {
      const validation = await CoreInfrastructure.validateEnvironment();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');
      expect(typeof validation.valid).toBe('boolean');
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(Array.isArray(validation.recommendations)).toBe(true);
    });

    it('should provide system information', () => {
      const systemInfo = CoreInfrastructure.getSystemInfo();
      
      expect(systemInfo).toHaveProperty('nodeVersion');
      expect(systemInfo).toHaveProperty('platform');
      expect(systemInfo).toHaveProperty('architecture');
      expect(systemInfo).toHaveProperty('memoryUsage');
      expect(systemInfo.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });
  });

  describe('Session Management', () => {
    let sessionManager: SessionManager;

    beforeEach(() => {
      sessionManager = new SessionManager({
        maxConcurrentSessions: 2,
        sessionTimeoutMs: 60000,
        persistentStorage: false,
        auditLogging: false
      });
    });

    afterEach(async () => {
      if (sessionManager) {
        await sessionManager.shutdown();
      }
    });

    it('should create sessions successfully', async () => {
      const sessionId = await sessionManager.createSession('standalone', { test: 'data' });
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
      
      const session = sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(session?.mode).toBe('standalone');
      expect(session?.context?.test).toBe('data');
    });

    it('should enforce session limits', async () => {
      await sessionManager.createSession('standalone');
      await sessionManager.createSession('integrated');
      
      await expect(sessionManager.createSession('standalone'))
        .rejects.toThrow('Maximum concurrent sessions');
    });

    it('should complete sessions', async () => {
      const sessionId = await sessionManager.createSession('standalone');
      const completed = await sessionManager.completeSession(sessionId, true);
      
      expect(completed).toBe(true);
      
      const session = sessionManager.getSession(sessionId);
      expect(session?.status).toBe('completed');
      expect(session?.endTime).toBeTruthy();
    });
  });

  describe('Mode Management', () => {
    let modeManager: ModeManager;

    beforeEach(() => {
      modeManager = new ModeManager('standalone');
    });

    afterEach(async () => {
      if (modeManager) {
        await modeManager.shutdown();
      }
    });

    it('should initialize with correct mode', () => {
      const currentMode = modeManager.getCurrentMode();
      expect(currentMode.mode).toBe('standalone');
      expect(currentMode.config).toHaveProperty('features');
      expect(currentMode.capabilities).toHaveProperty('cliInterface');
    });

    it('should switch modes', async () => {
      const switched = await modeManager.switchMode('integrated');
      expect(switched).toBe(true);
      
      const currentMode = modeManager.getCurrentMode();
      expect(currentMode.mode).toBe('integrated');
    });
  });

  describe('Configuration Management', () => {
    let configManager: ConfigManager;

    beforeEach(() => {
      const configPath = join(tempDir, 'test-config.json');
      configManager = new ConfigManager(configPath);
    });

    afterEach(async () => {
      if (configManager) {
        await configManager.shutdown();
      }
    });

    it('should initialize with default configuration', async () => {
      const initialized = await configManager.initialize();
      expect(initialized).toBe(true);
      
      const config = configManager.getConfig();
      expect(config).toHaveProperty('system');
      expect(config).toHaveProperty('session');
      expect(config).toHaveProperty('mode');
      expect(config).toHaveProperty('performance');
    });

    it('should load templates', async () => {
      await configManager.initialize();
      
      const loaded = await configManager.loadTemplate('enterprise');
      expect(loaded).toBe(true);
      
      const config = configManager.getConfig();
      expect(config.system.name).toBe('Phoenix Code Lite Enterprise');
    });
  });

  describe('Error Handling', () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
      errorHandler = new ErrorHandler();
    });

    afterEach(async () => {
      if (errorHandler) {
        await errorHandler.shutdown();
      }
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      
      const result = await errorHandler.handleError(error, {
        source: 'test-component',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM
      });
      
      expect(result).toHaveProperty('handled');
      expect(result).toHaveProperty('recovered');
      expect(result).toHaveProperty('action');
      expect(result.handled).toBe(true);
    });

    it('should provide error statistics', async () => {
      await errorHandler.handleError(new Error('Test error 1'));
      await errorHandler.handleError(new Error('Test error 2'));
      
      const stats = errorHandler.getErrorStats();
      expect(stats).toHaveProperty('totalErrors');
      expect(stats.totalErrors).toBeGreaterThan(0);
    });
  });

  describe('Core Foundation Integration', () => {
    let coreFoundation: CoreFoundation;
    let configManager: ConfigManager;

    beforeEach(async () => {
      const configPath = join(tempDir, 'core-config.json');
      configManager = new ConfigManager(configPath);
      await configManager.initialize();
      
      const config = configManager.getConfig();
      coreFoundation = new CoreFoundation(config);
    });

    afterEach(async () => {
      if (coreFoundation) {
        await coreFoundation.gracefulShutdown();
      }
      if (configManager) {
        await configManager.shutdown();
      }
    });

    it('should initialize successfully', async () => {
      const initialized = await coreFoundation.initialize();
      expect(initialized).toBe(true);
      expect(coreFoundation.isInitialized()).toBe(true);
      
      const components = coreFoundation.getComponents();
      expect(components).toHaveProperty('sessionManager');
      expect(components).toHaveProperty('modeManager');
      expect(components).toHaveProperty('auditLogger');
    });

    it('should provide system status', async () => {
      await coreFoundation.initialize();
      
      const status = coreFoundation.getSystemStatus();
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('details');
      expect(status).toHaveProperty('components');
      expect(['healthy', 'warning', 'critical']).toContain(status.status);
    });
  });
});