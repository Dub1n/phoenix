"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const foundation_1 = require("../../src/core/foundation");
const session_manager_1 = require("../../src/core/session-manager");
const mode_manager_1 = require("../../src/core/mode-manager");
const config_manager_1 = require("../../src/core/config-manager");
const error_handler_1 = require("../../src/core/error-handler");
const index_1 = require("../../src/core/index");
const fs_1 = require("fs");
const path_1 = require("path");
describe('Phase 1 Basic Infrastructure', () => {
    let tempDir;
    beforeAll(async () => {
        tempDir = (0, path_1.join)(__dirname, '..', 'temp', `test-${Date.now()}`);
        await fs_1.promises.mkdir(tempDir, { recursive: true });
        // Set test environment
        process.env.NODE_ENV = 'test';
    });
    afterAll(async () => {
        try {
            await fs_1.promises.rm(tempDir, { recursive: true });
        }
        catch (error) {
            console.warn('Cleanup warning:', error);
        }
    });
    describe('Core Components', () => {
        it('should validate environment', async () => {
            const validation = await index_1.CoreInfrastructure.validateEnvironment();
            expect(validation).toHaveProperty('valid');
            expect(validation).toHaveProperty('issues');
            expect(validation).toHaveProperty('recommendations');
        });
        it('should create and manage sessions', async () => {
            const sessionManager = new session_manager_1.SessionManager({
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
            }
            finally {
                await sessionManager.shutdown();
            }
        });
        it('should manage configuration', async () => {
            const configPath = (0, path_1.join)(tempDir, 'basic-config.json');
            const configManager = new config_manager_1.ConfigManager(configPath);
            try {
                const initialized = await configManager.initialize();
                expect(initialized).toBe(true);
                const config = configManager.getConfig();
                expect(config.system.name).toBe('Phoenix Code Lite');
                expect(config.mode.defaultMode).toBe('standalone');
            }
            finally {
                await configManager.shutdown();
            }
        });
        it('should handle modes', async () => {
            const modeManager = new mode_manager_1.ModeManager('standalone');
            try {
                const currentMode = modeManager.getCurrentMode();
                expect(currentMode.mode).toBe('standalone');
                // In test environment, mode switching should work
                const switched = await modeManager.switchMode('integrated');
                expect(switched).toBe(true);
                const newMode = modeManager.getCurrentMode();
                expect(newMode.mode).toBe('integrated');
            }
            finally {
                await modeManager.shutdown();
            }
        });
        it('should handle errors gracefully', async () => {
            const errorHandler = new error_handler_1.ErrorHandler();
            try {
                const result = await errorHandler.handleError(new Error('Test validation error'), {
                    source: 'test-component',
                    category: error_handler_1.ErrorCategory.VALIDATION,
                    severity: error_handler_1.ErrorSeverity.MEDIUM
                });
                expect(result.handled).toBe(true);
                expect(result.action).toBe('validation_failed');
            }
            finally {
                await errorHandler.shutdown();
            }
        });
    });
    describe('Integration Test', () => {
        it('should initialize core foundation successfully', async () => {
            const configPath = (0, path_1.join)(tempDir, 'integration-config.json');
            const configManager = new config_manager_1.ConfigManager(configPath);
            let coreFoundation;
            try {
                await configManager.initialize();
                const config = configManager.getConfig();
                coreFoundation = new foundation_1.CoreFoundation(config);
                const initialized = await coreFoundation.initialize();
                expect(initialized).toBe(true);
                expect(coreFoundation.isInitialized()).toBe(true);
                const status = coreFoundation.getSystemStatus();
                expect(['healthy', 'warning', 'critical']).toContain(status.status);
                const components = coreFoundation.getComponents();
                expect(components.sessionManager).toBeTruthy();
                expect(components.modeManager).toBeTruthy();
                expect(components.auditLogger).toBeTruthy();
            }
            finally {
                if (coreFoundation) {
                    await coreFoundation.gracefulShutdown();
                }
                await configManager.shutdown();
            }
        });
    });
});
//# sourceMappingURL=phase-1-basic.test.js.map