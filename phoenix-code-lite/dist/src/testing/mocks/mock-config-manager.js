"use strict";
/**---
 * title: [Mock Config Manager - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [MockConfigManager]
 * requires: []
 * description: [Mock implementation of IConfigManager for unit and integration tests.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockConfigManager = void 0;
function createDefaultConfig() {
    return {
        system: {
            name: 'Phoenix Code Lite',
            version: '1.0.0',
            environment: 'development',
            logLevel: 'info'
        },
        session: {
            maxConcurrentSessions: 2,
            sessionTimeoutMs: 1800000,
            persistentStorage: false,
            auditLogging: true
        },
        mode: {
            defaultMode: 'standalone',
            allowModeSwitching: true,
            autoDetectIntegration: true
        },
        performance: {
            maxMemoryUsage: 300,
            gcInterval: 300000,
            metricsCollection: true
        }
    };
}
class MockConfigManager {
    constructor() {
        this.config = createDefaultConfig();
        this.calls = [];
    }
    async getConfig() {
        this.calls.push({ method: 'getConfig', args: [] });
        return this.config;
    }
    async updateConfig(config) {
        this.calls.push({ method: 'updateConfig', args: [config] });
        this.config = { ...this.config, ...config };
    }
    validateConfig(config) {
        this.calls.push({ method: 'validateConfig', args: [config] });
        return true; // Mock validation always passes
    }
    async resetToDefaults() {
        this.calls.push({ method: 'resetToDefaults', args: [] });
        this.config = createDefaultConfig();
    }
    getCallHistory() {
        return this.calls;
    }
    setConfig(config) {
        this.config = config;
    }
    clearCallHistory() {
        this.calls = [];
    }
}
exports.MockConfigManager = MockConfigManager;
//# sourceMappingURL=mock-config-manager.js.map