"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoenixCodeLiteConfig = exports.PhoenixCodeLiteConfigSchema = exports.QualityGateConfigSchema = exports.AgentConfigSchema = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const zod_1 = require("zod");
// Configuration validation schemas
exports.AgentConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().default(true),
    priority: zod_1.z.number().min(0).max(1).default(0.8),
    timeout: zod_1.z.number().min(1000).max(600000).default(30000), // 30 seconds
    retryAttempts: zod_1.z.number().min(1).max(5).default(2),
    customPrompts: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
});
exports.QualityGateConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().default(true),
    strictMode: zod_1.z.boolean().default(false),
    thresholds: zod_1.z.object({
        syntaxValidation: zod_1.z.number().min(0).max(1).default(1.0),
        testCoverage: zod_1.z.number().min(0).max(1).default(0.8),
        codeQuality: zod_1.z.number().min(0).max(1).default(0.7),
        documentation: zod_1.z.number().min(0).max(1).default(0.6),
    }),
    weights: zod_1.z.object({
        syntaxValidation: zod_1.z.number().min(0).max(1).default(1.0),
        testCoverage: zod_1.z.number().min(0).max(1).default(0.8),
        codeQuality: zod_1.z.number().min(0).max(1).default(0.6),
        documentation: zod_1.z.number().min(0).max(1).default(0.4),
    }),
});
exports.PhoenixCodeLiteConfigSchema = zod_1.z.object({
    version: zod_1.z.string().default('1.0.0'),
    claude: zod_1.z.object({
        maxTurns: zod_1.z.number().min(1).max(10).default(3),
        timeout: zod_1.z.number().min(30000).max(1800000).default(300000), // 5 minutes
        retryAttempts: zod_1.z.number().min(1).max(5).default(3),
        model: zod_1.z.string().optional().default('claude-3-5-sonnet-20241022'),
    }).optional().default({
        maxTurns: 3,
        timeout: 300000,
        retryAttempts: 3,
        model: 'claude-3-5-sonnet-20241022',
    }),
    tdd: zod_1.z.object({
        maxImplementationAttempts: zod_1.z.number().min(1).max(10).default(5),
        testQualityThreshold: zod_1.z.number().min(0).max(1).default(0.8),
        enableRefactoring: zod_1.z.boolean().default(true),
        skipDocumentation: zod_1.z.boolean().default(false),
        qualityGates: exports.QualityGateConfigSchema.optional().default({
            enabled: true,
            strictMode: false,
            thresholds: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.7, documentation: 0.6 },
            weights: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.6, documentation: 0.4 },
        }),
    }).optional().default({
        maxImplementationAttempts: 5,
        testQualityThreshold: 0.8,
        enableRefactoring: true,
        skipDocumentation: false,
        qualityGates: {
            enabled: true,
            strictMode: false,
            thresholds: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.7, documentation: 0.6 },
            weights: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.6, documentation: 0.4 },
        },
    }),
    agents: zod_1.z.object({
        planningAnalyst: exports.AgentConfigSchema.optional().default({ enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 }),
        implementationEngineer: exports.AgentConfigSchema.optional().default({ enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 }),
        qualityReviewer: exports.AgentConfigSchema.optional().default({ enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 }),
        enableSpecialization: zod_1.z.boolean().default(true),
        fallbackToGeneric: zod_1.z.boolean().default(true),
    }).optional().default({
        planningAnalyst: { enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 },
        implementationEngineer: { enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 },
        qualityReviewer: { enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 },
        enableSpecialization: true,
        fallbackToGeneric: true,
    }),
    output: zod_1.z.object({
        verbose: zod_1.z.boolean().default(false),
        showMetrics: zod_1.z.boolean().default(true),
        saveArtifacts: zod_1.z.boolean().default(true),
        logLevel: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    }).optional().default({
        verbose: false,
        showMetrics: true,
        saveArtifacts: true,
        logLevel: 'info',
    }),
    quality: zod_1.z.object({
        minTestCoverage: zod_1.z.number().min(0).max(1).default(0.8),
        maxComplexity: zod_1.z.number().min(1).max(50).default(10),
        requireDocumentation: zod_1.z.boolean().default(true),
        enforceStrictMode: zod_1.z.boolean().default(false),
    }).optional().default({
        minTestCoverage: 0.8,
        maxComplexity: 10,
        requireDocumentation: true,
        enforceStrictMode: false,
    }),
});
class PhoenixCodeLiteConfig {
    constructor(data, configPath) {
        this.data = data;
        this.configPath = configPath;
    }
    static async load(projectPath) {
        const configPath = (0, path_1.join)(projectPath || process.cwd(), '.phoenix-code-lite.json');
        try {
            const content = await fs_1.promises.readFile(configPath, 'utf-8');
            const rawData = JSON.parse(content);
            // Validate and parse configuration with Zod
            const data = exports.PhoenixCodeLiteConfigSchema.parse(rawData);
            return new PhoenixCodeLiteConfig(data, configPath);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.warn('Configuration validation failed, using defaults:', error.issues);
            }
            // Return default configuration if file doesn't exist or is invalid
            return PhoenixCodeLiteConfig.getDefault(configPath);
        }
    }
    static getDefault(configPath) {
        const defaultData = exports.PhoenixCodeLiteConfigSchema.parse({});
        return new PhoenixCodeLiteConfig(defaultData, configPath || (0, path_1.join)(process.cwd(), '.phoenix-code-lite.json'));
    }
    async save(force = false) {
        try {
            // Validate configuration before saving
            const validatedData = exports.PhoenixCodeLiteConfigSchema.parse(this.data);
            // Check if file exists
            if (!force) {
                try {
                    await fs_1.promises.access(this.configPath);
                    throw new Error('Configuration file already exists. Use --force to overwrite.');
                }
                catch (error) {
                    // File doesn't exist, continue with save
                    if (error instanceof Error && error.message.includes('already exists')) {
                        throw error;
                    }
                }
            }
            const content = JSON.stringify(validatedData, null, 2);
            await fs_1.promises.writeFile(this.configPath, content, 'utf-8');
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Configuration validation failed: ${error.issues.map(e => e.message).join(', ')}`);
            }
            throw error;
        }
    }
    get(key) {
        return this.getNestedValue(this.data, key);
    }
    set(key, value) {
        this.setNestedValue(this.data, key, value);
        // Re-validate after setting
        try {
            this.data = exports.PhoenixCodeLiteConfigSchema.parse(this.data);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Invalid configuration value: ${error.issues.map(e => e.message).join(', ')}`);
            }
            throw error;
        }
    }
    getAgentConfig(agentType) {
        return this.data.agents[agentType];
    }
    getQualityGateConfig() {
        return this.data.tdd.qualityGates;
    }
    isAgentEnabled(agentType) {
        return this.data.agents.enableSpecialization && this.data.agents[agentType].enabled;
    }
    shouldFallbackToGeneric() {
        return this.data.agents.fallbackToGeneric;
    }
    validate() {
        try {
            exports.PhoenixCodeLiteConfigSchema.parse(this.data);
            return [];
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
            }
            return [error instanceof Error ? error.message : 'Unknown validation error'];
        }
    }
    // Deep clone configuration for safe modifications
    clone() {
        const clonedData = JSON.parse(JSON.stringify(this.data));
        return new PhoenixCodeLiteConfig(clonedData, this.configPath);
    }
    // Merge with another configuration
    merge(otherConfig) {
        const mergedData = this.deepMerge(this.data, otherConfig);
        const validatedData = exports.PhoenixCodeLiteConfigSchema.parse(mergedData);
        return new PhoenixCodeLiteConfig(validatedData, this.configPath);
    }
    // Export configuration for debugging
    export() {
        return JSON.parse(JSON.stringify(this.data));
    }
    getNestedValue(obj, key) {
        return key.split('.').reduce((current, prop) => current?.[prop], obj);
    }
    setNestedValue(obj, key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, prop) => {
            if (!(prop in current)) {
                current[prop] = {};
            }
            return current[prop];
        }, obj);
        target[lastKey] = value;
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
}
exports.PhoenixCodeLiteConfig = PhoenixCodeLiteConfig;
//# sourceMappingURL=settings.js.map