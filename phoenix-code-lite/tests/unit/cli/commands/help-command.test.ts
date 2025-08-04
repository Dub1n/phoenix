import { HelpCommand } from '../../../../src/cli/commands/help-command';
import { MockAuditLogger } from '../../../../src/testing/mocks/mock-audit-logger';
import { CLITestUtils } from '../../../../src/testing/utils/cli-test-utils';

describe('HelpCommand', () => {
  let auditLogger: MockAuditLogger;
  let command: HelpCommand;

  beforeEach(() => {
    auditLogger = new MockAuditLogger();
    command = new HelpCommand(auditLogger);
  });

  test('should display help information', async () => {
    const output = await CLITestUtils.captureConsoleOutput(async () => {
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
    const output = await CLITestUtils.captureConsoleOutput(async () => {
      await command.execute([]);
    });

    expect(output).toContain('init');
    expect(output).toContain('wizard');
    expect(output).toContain('template');
  });
}); 