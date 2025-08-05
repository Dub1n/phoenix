"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const version_command_1 = require("../../../../src/cli/commands/version-command");
const mock_audit_logger_1 = require("../../../../src/testing/mocks/mock-audit-logger");
const cli_test_utils_1 = require("../../../../src/testing/utils/cli-test-utils");
describe('VersionCommand', () => {
    let auditLogger;
    let command;
    beforeEach(() => {
        auditLogger = new mock_audit_logger_1.MockAuditLogger();
        command = new version_command_1.VersionCommand(auditLogger);
    });
    test('should display version information', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute([]);
        });
        expect(output).toContain('Phoenix Code Lite v1.0.0');
        expect(output).toContain('TDD workflow orchestrator for Claude Code SDK');
    });
    test('should log audit events', async () => {
        await command.execute([]);
        const logs = auditLogger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe('Version command executed');
    });
    test('should show development status', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await command.execute([]);
        });
        expect(output).toContain('Development Status:');
        expect(output).toContain('✓ Phase 1: Environment Setup & Project Foundation');
        expect(output).toContain('✓ Phase 8: Production Readiness');
    });
});
//# sourceMappingURL=version-command.test.js.map