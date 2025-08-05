"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interactive_session_1 = require("../../../../src/cli/interactive/interactive-session");
const cli_test_utils_1 = require("../../../../src/testing/utils/cli-test-utils");
describe('InteractiveSession', () => {
    let session;
    let mocks;
    beforeEach(() => {
        mocks = cli_test_utils_1.CLITestUtils.createMockDependencies();
        const commandFactory = cli_test_utils_1.CLITestUtils.createCommandFactory(mocks);
        session = new interactive_session_1.InteractiveSession(commandFactory, mocks.auditLogger, mocks.configManager);
    });
    test('should start interactive session', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await session.start();
        });
        expect(output).toContain('Phoenix Code Lite Interactive CLI');
        expect(output).toContain('Type "help" for available commands');
        expect(mocks.auditLogger.getLogs()).toHaveLength(1);
        expect(mocks.auditLogger.getLogs()[0].message).toBe('Interactive session started');
    });
    test('should display main menu', async () => {
        const output = await cli_test_utils_1.CLITestUtils.captureConsoleOutput(async () => {
            await session.start();
        });
        expect(output).toContain('Main Menu:');
        expect(output).toContain('1. Generate Code');
        expect(output).toContain('2. Configuration');
        expect(output).toContain('3. Help');
        expect(output).toContain('4. Version');
        expect(output).toContain('5. Quit');
    });
    test('should log session start', async () => {
        await session.start();
        const logs = mocks.auditLogger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe('Interactive session started');
    });
});
//# sourceMappingURL=interactive-session.test.js.map