/**---
 * title: [Configuration Manager - Core Infrastructure Component]
 * tags: [Core, Infrastructure, Configuration, Validation]
 * provides: [ConfigManager Class, Template Loading, Hot Reloading, Validation, Summary APIs]
 * requires: [Zod, FS, CoreConfigSchema, AuditLogger]
 * description: [Manages Phoenix Code Lite configuration with schema validation, file persistence, hot reload, template management, and change notifications for core systems.]
 * ---*/
import { CoreConfig } from './foundation';
export declare const ConfigTemplates: {
    readonly starter: {
        readonly system: {
            readonly name: "Phoenix Code Lite";
            readonly version: "1.0.0";
            readonly environment: "development";
            readonly logLevel: "info";
        };
        readonly session: {
            readonly maxConcurrentSessions: 2;
            readonly sessionTimeoutMs: 1800000;
            readonly persistentStorage: false;
            readonly auditLogging: true;
        };
        readonly mode: {
            readonly defaultMode: "standalone";
            readonly allowModeSwitching: true;
            readonly autoDetectIntegration: true;
        };
        readonly performance: {
            readonly maxMemoryUsage: 300;
            readonly gcInterval: 300000;
            readonly metricsCollection: true;
        };
    };
    readonly enterprise: {
        readonly system: {
            readonly name: "Phoenix Code Lite Enterprise";
            readonly version: "1.0.0";
            readonly environment: "production";
            readonly logLevel: "warn";
        };
        readonly session: {
            readonly maxConcurrentSessions: 10;
            readonly sessionTimeoutMs: 7200000;
            readonly persistentStorage: true;
            readonly auditLogging: true;
        };
        readonly mode: {
            readonly defaultMode: "integrated";
            readonly allowModeSwitching: true;
            readonly autoDetectIntegration: true;
        };
        readonly performance: {
            readonly maxMemoryUsage: 1000;
            readonly gcInterval: 180000;
            readonly metricsCollection: true;
        };
    };
    readonly performance: {
        readonly system: {
            readonly name: "Phoenix Code Lite Performance";
            readonly version: "1.0.0";
            readonly environment: "production";
            readonly logLevel: "error";
        };
        readonly session: {
            readonly maxConcurrentSessions: 5;
            readonly sessionTimeoutMs: 3600000;
            readonly persistentStorage: false;
            readonly auditLogging: false;
        };
        readonly mode: {
            readonly defaultMode: "integrated";
            readonly allowModeSwitching: false;
            readonly autoDetectIntegration: false;
        };
        readonly performance: {
            readonly maxMemoryUsage: 750;
            readonly gcInterval: 120000;
            readonly metricsCollection: false;
        };
    };
};
export type ConfigTemplate = keyof typeof ConfigTemplates;
/**
 * Configuration management with validation, persistence, and hot reloading
 */
export declare class ConfigManager {
    private config;
    private configPath;
    private auditLogger;
    private watchInterval?;
    private lastModified?;
    private callbacks;
    constructor(configPath?: string);
    /**
     * Initialize configuration manager
     */
    initialize(): Promise<boolean>;
    /**
     * Get current configuration
     */
    getConfig(): CoreConfig;
    /**
     * Update configuration with validation
     */
    updateConfig(updates: Partial<CoreConfig>): Promise<boolean>;
    /**
     * Load configuration template
     */
    loadTemplate(templateName: ConfigTemplate): Promise<boolean>;
    /**
     * Get available templates
     */
    getAvailableTemplates(): {
        name: ConfigTemplate;
        description: string;
        suitableFor: string[];
    }[];
    /**
     * Validate current configuration
     */
    validateConfig(): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Get configuration summary
     */
    getConfigSummary(): {
        template: string;
        mode: string;
        environment: string;
        features: {
            name: string;
            enabled: boolean;
            value?: any;
        }[];
        limits: {
            name: string;
            value: any;
            unit?: string;
        }[];
    };
    /**
     * Register configuration change callback
     */
    onConfigChange(id: string, callback: (config: CoreConfig) => void): void;
    /**
     * Unregister configuration change callback
     */
    offConfigChange(id: string): void;
    /**
     * Load configuration from file
     */
    private loadFromFile;
    /**
     * Save configuration to file
     */
    private saveToFile;
    /**
     * Setup file watching for hot reloading
     */
    private setupFileWatching;
    /**
     * Detect which template the current configuration matches
     */
    private detectTemplate;
    /**
     * Check if configuration matches a template
     */
    private configMatches;
    /**
     * Merge configuration objects deeply
     */
    private mergeConfigs;
    /**
     * Get configuration changes between two configs
     */
    private getConfigChanges;
    /**
     * Sanitize configuration for logging (remove sensitive data)
     */
    private sanitizeConfig;
    /**
     * Notify all registered callbacks
     */
    private notifyCallbacks;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=config-manager.d.ts.map