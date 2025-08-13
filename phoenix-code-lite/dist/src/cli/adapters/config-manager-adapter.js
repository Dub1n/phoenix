"use strict";
/**---
 * title: [Config Manager Adapter - CLI Integration]
 * tags: [CLI, Adapter, Configuration]
 * provides: [Adapter Functions, Manager Wiring]
 * requires: [PhoenixCodeLiteConfig, IConfigManager]
 * description: [Adapter bridging CLI usage patterns to config manager contracts and implementation.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManagerAdapter = void 0;
class ConfigManagerAdapter {
    constructor(configManager) {
        this.configManager = configManager;
    }
    async getConfig() {
        return this.configManager.getConfig();
    }
    async updateConfig(config) {
        await this.configManager.updateConfig(config);
    }
    validateConfig(config) {
        const validation = this.configManager.validateConfig();
        return validation.valid;
    }
    async resetToDefaults() {
        // For now, we'll create a new config with defaults
        // In a real implementation, this would reset to the actual defaults
        const defaultConfig = {
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
        await this.configManager.updateConfig(defaultConfig);
    }
}
exports.ConfigManagerAdapter = ConfigManagerAdapter;
//# sourceMappingURL=config-manager-adapter.js.map