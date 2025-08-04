import { ConfigCommand } from '../../../../src/cli/commands/config-command';
import { MockConfigManager } from '../../../../src/testing/mocks/mock-config-manager';
import { MockAuditLogger } from '../../../../src/testing/mocks/mock-audit-logger';
import { CLITestUtils } from '../../../../src/testing/utils/cli-test-utils';

describe('ConfigCommand', () => {
  let configManager: MockConfigManager;
  let auditLogger: MockAuditLogger;
  let command: ConfigCommand;

  beforeEach(() => {
    configManager = new MockConfigManager();
    auditLogger = new MockAuditLogger();
    command = new ConfigCommand(configManager, auditLogger);
  });

  test('should display configuration when --show flag used', async () => {
    const testConfig = { 
      system: { 
        name: 'Test Phoenix', 
        version: '1.0.0',
        environment: 'development' as const,
        logLevel: 'info' as const
      },
      session: {
        maxConcurrentSessions: 2,
        sessionTimeoutMs: 1800000,
        persistentStorage: false,
        auditLogging: true
      },
      mode: {
        defaultMode: 'standalone' as const,
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

    const output = await CLITestUtils.captureConsoleOutput(async () => {
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
    const output = await CLITestUtils.captureConsoleOutput(async () => {
      await command.execute([]);
    });

    expect(output).toContain('Configuration commands:');
    expect(output).toContain('--show');
    expect(output).toContain('--edit');
  });

  test('should handle reset command', async () => {
    const output = await CLITestUtils.captureConsoleOutput(async () => {
      await command.execute(['--reset']);
    });

    expect(output).toContain('✓ Configuration reset to defaults');
    
    const callHistory = configManager.getCallHistory();
    expect(callHistory).toContainEqual({ method: 'resetToDefaults', args: [] });
  });

  test('should handle template application', async () => {
    const output = await CLITestUtils.captureConsoleOutput(async () => {
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