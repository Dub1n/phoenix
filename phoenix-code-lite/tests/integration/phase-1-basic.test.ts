import { CoreFoundation } from '../../src/core/foundation';
import { SessionManager } from '../../src/core/session-manager';
import { ModeManager } from '../../src/core/mode-manager';
import { ConfigManager } from '../../src/core/config-manager';
import { ErrorHandler, ErrorSeverity, ErrorCategory } from '../../src/core/error-handler';
import { CoreInfrastructure } from '../../src/core/index';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('Phase 1 Basic Infrastructure', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = join(__dirname, '..', 'temp', `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Core Components', () => {
    it('should validate environment', async () => {
      const validation = await CoreInfrastructure.validateEnvironment();
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');
    });

    it('should create and manage sessions', async () => {
      const sessionManager = new SessionManager({
        maxConcurrentSessions: 2,
        sessionTimeoutMs: 60000,
        persistentStorage: false,
        auditLogging: false
      });

      try {
        const sessionId = await sessionManager.createSession('standalone', { test: 'data' });
        expect(sessionId).toBeTruthy();
        expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
        
        const session = sessionManager.getSession(sessionId);
        expect(session?.mode).toBe('standalone');
        expect(session?.context?.test).toBe('data');
        
        await sessionManager.completeSession(sessionId, true);
      } finally {
        await sessionManager.shutdown();
      }
    });

    it('should manage configuration', async () => {
      const configPath = join(tempDir, 'basic-config.json');
      const configManager = new ConfigManager(configPath);

      try {
        const initialized = await configManager.initialize();
        expect(initialized).toBe(true);
        
        const config = configManager.getConfig();
        expect(config.system.name).toBe('Phoenix Code Lite');
        expect(config.mode.defaultMode).toBe('standalone');
      } finally {
        await configManager.shutdown();
      }
    });

    it('should handle modes', async () => {
      const modeManager = new ModeManager('standalone');

      try {
        const currentMode = modeManager.getCurrentMode();
        expect(currentMode.mode).toBe('standalone');
        
        // In test environment, mode switching should work
        const switched = await modeManager.switchMode('integrated');
        expect(switched).toBe(true);
        
        const newMode = modeManager.getCurrentMode();
        expect(newMode.mode).toBe('integrated');
      } finally {
        await modeManager.shutdown();
      }
    });

    it('should handle errors gracefully', async () => {
      const errorHandler = new ErrorHandler();

      try {
        const result = await errorHandler.handleError(
          new Error('Test validation error'),
          {
            source: 'test-component',
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.MEDIUM
          }
        );
        
        expect(result.handled).toBe(true);
        expect(result.action).toBe('validation_failed');
      } finally {
        await errorHandler.shutdown();
      }
    });
  });

  describe('Integration Test', () => {
    it('should initialize core foundation successfully', async () => {
      const configPath = join(tempDir, 'integration-config.json');
      const configManager = new ConfigManager(configPath);
      let coreFoundation: CoreFoundation | undefined;

      try {
        await configManager.initialize();
        const config = configManager.getConfig();
        
        coreFoundation = new CoreFoundation(config);
        const initialized = await coreFoundation.initialize();
        
        expect(initialized).toBe(true);
        expect(coreFoundation.isInitialized()).toBe(true);
        
        const status = coreFoundation.getSystemStatus();
        expect(['healthy', 'warning', 'critical']).toContain(status.status);
        
        const components = coreFoundation.getComponents();
        expect(components.sessionManager).toBeTruthy();
        expect(components.modeManager).toBeTruthy();
        expect(components.auditLogger).toBeTruthy();
        
      } finally {
        if (coreFoundation) {
          await coreFoundation.gracefulShutdown();
        }
        await configManager.shutdown();
      }
    });
  });
});