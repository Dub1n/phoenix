"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const help_command_1 = require("../../../../src/cli/commands/help-command");
const mock_audit_logger_1 = require("../../../../src/testing/mocks/mock-audit-logger");
const cli_test_utils_1 = require("../../../../src/testing/utils/cli-test-utils");
describe('HelpCommand', () => {
    let auditLogger;
    let command;
    beforeEach(() => {
        auditLogger = new mock_audit_logger_1.MockAuditLogger();
        command = new help_command_1.HelpCommand(auditLogger);
    });
    test('should display help information', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute([]);
        });
        expect(output).toContain('Phoenix Code Lite - Available Commands:');
        expect(output).toContain('config --show');
        expect(output).toContain('help');
        expect(output).toContain('version');
        expect(output).toContain('generate');
    });
    test('should log audit events', async () => {
        await command.execute([]);
        const logs = auditLogger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe('Help command executed');
    });
    test('should include all command categories', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute([]);
        });
        expect(output).toContain('init');
        expect(output).toContain('wizard');
        expect(output).toContain('template');
    });
});
//# sourceMappingURL=help-command.test.js.map