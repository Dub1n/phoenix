"use strict";
/**---
tags: [Integration, Testing, CLI, Interactive, Logue]
provides: [Interactive CLI Test Suite, CLI Integration Testing Infrastructure]
requires: [Logue Library, Phoenix CLI, Jest Test Framework]
---*/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logue_1 = __importDefault(require("logue"));
const logue_wrapper_1 = require("../../src/utils/logue-wrapper");
const globals_1 = require("@jest/globals");
const path_1 = __importDefault(require("path"));
(0, globals_1.describe)('Interactive CLI Tests - Phase 1', () => {
    const CLI_PATH = path_1.default.join(__dirname, '../../dist/src/index.js');
    (0, globals_1.beforeAll)(async () => {
        // Ensure CLI is built and ready for testing
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const cliExists = fs.existsSync(CLI_PATH);
        if (!cliExists) {
            throw new Error(`CLI not found at ${CLI_PATH}. Run 'npm run build' first.`);
        }
        // Set NODE_ENV=test for all CLI child processes
        // This tells the CLI to use safeExit() and not call process.exit()
        process.env.NODE_ENV = 'test';
    });
    afterAll(() => {
        // Clean up environment
        delete process.env.NODE_ENV;
    });
    (0, globals_1.test)('config command displays configuration', async () => {
        console.log('Testing CLI config command with enhanced logue...');
        const app = (0, logue_wrapper_1.enhancedLogue)('node', [CLI_PATH, 'config', '--show']);
        // Wait for expected text
        await app.waitFor('Phoenix Code Lite Configuration');
        console.log('✓ Found expected text in CLI output');
        console.log('About to call enhanced app.end()...');
        // Enhanced logue handles cleanup automatically
        const result = await app.end();
        console.log('✓ Enhanced app.end() completed successfully!');
        console.log('CLI Result:', {
            status: result.status,
            stdout: result.stdout.substring(0, 300) + '...'
        });
        (0, globals_1.expect)(app.stdout).toContain('Configuration');
    }, 30000);
    (0, globals_1.test)('help command displays available commands', async () => {
        console.log('Testing CLI help command with logue...');
        const app = (0, logue_1.default)('node', [CLI_PATH, 'help']);
        await app.waitFor('Usage:');
        console.log('✓ Found Usage text in help output');
        const result = await app.end();
        console.log('Help Result:', {
            stdout: result.stdout.substring(0, 300) + '...'
        });
        (0, globals_1.expect)(app.stdout).toContain('Usage:');
        (0, globals_1.expect)(app.stdout).toContain('Commands:');
    }, 25000);
    (0, globals_1.test)('version command displays version info', async () => {
        console.log('Testing CLI version command with logue...');
        const app = (0, logue_1.default)('node', [CLI_PATH, '--version']);
        await app.waitFor('1.0.0');
        console.log('✓ Found version number in output');
        const result = await app.end();
        console.log('Version Result:', {
            stdout: result.stdout.substring(0, 300) + '...'
        });
        (0, globals_1.expect)(app.stdout).toContain('1.0.0');
    }, 25000);
});
//# sourceMappingURL=cli-interactive.test.js.map