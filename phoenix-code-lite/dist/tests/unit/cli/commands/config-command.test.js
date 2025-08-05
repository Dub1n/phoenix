"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_command_1 = require("../../../../src/cli/commands/config-command");
const mock_config_manager_1 = require("../../../../src/testing/mocks/mock-config-manager");
const mock_audit_logger_1 = require("../../../../src/testing/mocks/mock-audit-logger");
const cli_test_utils_1 = require("../../../../src/testing/utils/cli-test-utils");
describe('ConfigCommand', () => {
    let configManager;
    let auditLogger;
    let command;
    beforeEach(() => {
        configManager = new mock_config_manager_1.MockConfigManager();
        auditLogger = new mock_audit_logger_1.MockAuditLogger();
        command = new config_command_1.ConfigCommand(configManager, auditLogger);
    });
    test('should display configuration when --show flag used', async () => {
        const testConfig = {
            system: {
                name: 'Test Phoenix',
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
        configManager.setConfig(testConfig);
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute(['--show']);
        });
        expect(output).toContain('Phoenix Code Lite Configuration');
        expect(output).toContain('Configuration loaded successfully');
        expect(auditLogger.getLogs()).toHaveLength(1);
        expect(auditLogger.getLogs()[0].level).toBe('info');
        expect(auditLogger.getLogs()[0].message).toBe('Config command executed');
    });
    test('should log audit events', async () => {
        await command.execute(['--show']);
        const logs = auditLogger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe('Config command executed');
    });
    test('should show help when no flags provided', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute([]);
        });
        expect(output).toContain('Configuration commands:');
        expect(output).toContain('--show');
        expect(output).toContain('--edit');
    });
    test('should handle reset command', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute(['--reset']);
        });
        expect(output).toContain('✓ Configuration reset to defaults');
        const callHistory = configManager.getCallHistory();
        expect(callHistory).toContainEqual({ method: 'resetToDefaults', args: [] });
    });
    test('should handle template application', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute(['--use', 'starter']);
        });
        expect(output).toContain('✓ Applied template: starter');
        const logs = auditLogger.getLogs();
        expect(logs).toHaveLength(2); // One for command execution, one for template application
        expect(logs[1].message).toBe('Applying template');
    });
    test('should handle errors gracefully', async () => {
        // Mock configManager to throw an error
        jest.spyOn(configManager, 'getConfig').mockRejectedValue(new Error('Config error'));
        await expect(command.execute(['--show'])).rejects.toThrow('Config error');
        const logs = auditLogger.getLogs();
        expect(logs).toHaveLength(2); // One for command execution, one for error
        expect(logs[1].level).toBe('error');
        expect(logs[1].message).toBe('Config command failed');
    });
});
//# sourceMappingURL=config-command.test.js.map