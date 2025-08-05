import { VersionCommand } from '../../../../src/cli/commands/version-command';
import { MockAuditLogger } from '../../../../src/testing/mocks/mock-audit-logger';
import { CLITestUtils } from '../../../../src/testing/utils/cli-test-utils';

describe('VersionCommand', () => {
  let auditLogger: MockAuditLogger;
  let command: VersionCommand;

  beforeEach(() => {
    auditLogger = new MockAuditLogger();
    command = new VersionCommand(auditLogger);
  });

  test('should display version information', async () => {
    const output = await CLITestUtils.captureConsoleOutput(async () => {
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
    const output = await CLITestUtils.captureConsoleOutput(async () => {
      await command.execute([]);
    });

    expect(output).toContain('Development Status:');
    expect(output).toContain('✓ Phase 1: Environment Setup & Project Foundation');
    expect(output).toContain('✓ Phase 8: Production Readiness');
  });
}); 