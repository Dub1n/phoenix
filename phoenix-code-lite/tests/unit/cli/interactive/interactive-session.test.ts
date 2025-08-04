import { InteractiveSession } from '../../../../src/cli/interactive/interactive-session';
import { MockConfigManager } from '../../../../src/testing/mocks/mock-config-manager';
import { MockAuditLogger } from '../../../../src/testing/mocks/mock-audit-logger';
import { MockClaudeClient } from '../../../../src/testing/mocks/mock-claude-client';
import { MockFileSystem } from '../../../../src/testing/mocks/mock-file-system';
import { CommandFactory } from '../../../../src/cli/factories/command-factory';
import { CLITestUtils } from '../../../../src/testing/utils/cli-test-utils';

describe('InteractiveSession', () => {
  let session: InteractiveSession;
  let mocks: ReturnType<typeof CLITestUtils.createMockDependencies>;

  beforeEach(() => {
    mocks = CLITestUtils.createMockDependencies();
    const commandFactory = CLITestUtils.createCommandFactory(mocks);
    session = new InteractiveSession(
      commandFactory,
      mocks.auditLogger,
      mocks.configManager
    );
  });

  test('should start interactive session', async () => {
    const output = await CLITestUtils.captureConsoleOutput(async () => {
      await session.start();
    });

    expect(output).toContain('Phoenix Code Lite Interactive CLI');
    expect(output).toContain('Type "help" for available commands');
    expect(mocks.auditLogger.getLogs()).toHaveLength(1);
    expect(mocks.auditLogger.getLogs()[0].message).toBe('Interactive session started');
  });

  test('should display main menu', async () => {
    const output = await CLITestUtils.captureConsoleOutput(async () => {
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