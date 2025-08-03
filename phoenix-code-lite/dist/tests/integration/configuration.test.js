"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// tests/integration/configuration.test.ts
const settings_1 = require("../../src/config/settings");
const templates_1 = require("../../src/config/templates");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
describe('Phase 5: Configuration Management', () => {
    const testConfigPath = path.join(__dirname, 'test-config.json');
    afterEach(async () => {
        try {
            await fs.unlink(testConfigPath);
        }
        catch {
            // File may not exist
        }
    });
    describe('Configuration Schema Validation', () => {
        test('PhoenixCodeLiteConfigSchema validates valid configuration', () => {
            const validConfig = {
                version: '1.0.0',
                claude: {
                    maxTurns: 3,
                    timeout: 300000,
                    retryAttempts: 3
                },
                tdd: {
                    maxImplementationAttempts: 5,
                    testQualityThreshold: 0.8,
                    enableRefactoring: true,
                    skipDocumentation: false
                }
            };
            expect(() => settings_1.PhoenixCodeLiteConfigSchema.parse(validConfig)).not.toThrow();
        });
        test('Schema rejects invalid configuration values', () => {
            const invalidConfig = {
                claude: {
                    maxTurns: 15, // Should be max 10
                    timeout: -1, // Should be positive
                }
            };
            expect(() => settings_1.PhoenixCodeLiteConfigSchema.parse(invalidConfig)).toThrow();
        });
    });
    describe('Configuration Class', () => {
        test('Can create default configuration', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault(testConfigPath);
            expect(config).toBeInstanceOf(settings_1.PhoenixCodeLiteConfig);
        });
        test('Can save and load configuration', async () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault(testConfigPath);
            await config.save();
            const loadedConfig = await settings_1.PhoenixCodeLiteConfig.load(path.dirname(testConfigPath));
            expect(loadedConfig.get('version')).toBe('1.0.0');
        });
        test('Can get and set nested values', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            config.set('claude.maxTurns', 5);
            expect(config.get('claude.maxTurns')).toBe(5);
            expect(config.get('tdd.enableRefactoring')).toBe(true);
        });
        test('Validates configuration when setting values', () => {
            // Create a fresh config instance for this test
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            expect(() => config.set('claude.maxTurns', 15)).toThrow(); // Max is 10
            expect(() => config.set('claude.timeout', -1)).toThrow(); // Must be positive
        });
    });
    describe('Configuration Templates', () => {
        test('Starter template has appropriate settings', () => {
            const template = templates_1.ConfigurationTemplates.getStarterTemplate();
            expect(template.claude?.maxTurns).toBe(2);
            expect(template.tdd?.testQualityThreshold).toBe(0.7);
            expect(template.quality?.minTestCoverage).toBe(0.7);
        });
        test('Enterprise template has strict settings', () => {
            const template = templates_1.ConfigurationTemplates.getEnterpriseTemplate();
            expect(template.claude?.maxTurns).toBe(5);
            expect(template.tdd?.testQualityThreshold).toBe(0.9);
            expect(template.quality?.minTestCoverage).toBe(0.9);
            expect(template.quality?.enforceStrictMode).toBe(true);
        });
        test('Performance template optimizes for speed', () => {
            const template = templates_1.ConfigurationTemplates.getPerformanceTemplate();
            expect(template.claude?.maxTurns).toBe(2);
            expect(template.tdd?.enableRefactoring).toBe(false);
            expect(template.tdd?.skipDocumentation).toBe(true);
        });
    });
    describe('Agent Configuration', () => {
        test('Can configure individual agents', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            const planningConfig = config.getAgentConfig('planningAnalyst');
            expect(planningConfig.enabled).toBe(true);
            expect(config.isAgentEnabled('implementationEngineer')).toBe(true);
        });
        test('Can disable agent specialization', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            // First verify it starts enabled
            expect(config.isAgentEnabled('planningAnalyst')).toBe(true);
            // Disable specialization - create a fresh config to avoid state issues
            const freshConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
            freshConfig.set('agents.enableSpecialization', false);
            // Should now be disabled
            expect(freshConfig.isAgentEnabled('planningAnalyst')).toBe(false);
        });
    });
});
//# sourceMappingURL=configuration.test.js.map